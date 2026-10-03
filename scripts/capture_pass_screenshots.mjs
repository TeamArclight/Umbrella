import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\Documents\\UMBRELLA\\docs\\screenshots';
const userDataDir = path.join(process.env.TEMP || 'C:\\temp', 'cdp_prof_pass_' + Date.now());

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const requiredShots = [
  // 1. Dashboard CLOSED across requested resolutions
  { name: 'dashboard_closed_1440x900.png', url: 'http://127.0.0.1:3000/dashboard', w: 1440, h: 900, waitMs: 4000 },
  { name: 'dashboard_closed_1280x720.png', url: 'http://127.0.0.1:3000/dashboard', w: 1280, h: 720, waitMs: 3500 },
  { name: 'dashboard_closed_1024x768.png', url: 'http://127.0.0.1:3000/dashboard', w: 1024, h: 768, waitMs: 3500 },
  { name: 'dashboard_closed_768x1024.png', url: 'http://127.0.0.1:3000/dashboard', w: 768, h: 1024, waitMs: 3500 },
  { name: 'dashboard_closed_390x844.png', url: 'http://127.0.0.1:3000/dashboard', w: 390, h: 844, waitMs: 3500 },

  // 2. Dashboard OPEN (master-detail layout, map visible)
  { name: 'dashboard_open_1440x900.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 1440, h: 900, waitMs: 4500 },
  { name: 'dashboard_open_1280x720.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 1280, h: 720, waitMs: 3500 },
  { name: 'dashboard_open_1024x768.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 1024, h: 768, waitMs: 3500 },
  { name: 'dashboard_open_768x1024.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 768, h: 1024, waitMs: 3500 },
  { name: 'dashboard_open_390x844.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 390, h: 844, waitMs: 3500 },

  // 3. Live Risk Monitor
  { name: 'live_risk_1440x900.png', url: 'http://127.0.0.1:3000/live-risk', w: 1440, h: 900, waitMs: 4500 },
  { name: 'live_risk_390x844.png', url: 'http://127.0.0.1:3000/live-risk', w: 390, h: 844, waitMs: 3500 },

  // 4. Historical Replay
  { name: 'historical_replay_1440x900.png', url: 'http://127.0.0.1:3000/historical-replay', w: 1440, h: 900, waitMs: 5000 },
  { name: 'historical_replay_390x844.png', url: 'http://127.0.0.1:3000/historical-replay', w: 390, h: 844, waitMs: 4000 },

  // 5. Portfolio Exposure
  { name: 'portfolio_1440x900.png', url: 'http://127.0.0.1:3000/portfolio', w: 1440, h: 900, waitMs: 4000 },
  { name: 'portfolio_390x844.png', url: 'http://127.0.0.1:3000/portfolio', w: 390, h: 844, waitMs: 3500 },

  // Canonical baseline screenshots
  { name: '01_command_center_dashboard.png', url: 'http://127.0.0.1:3000/dashboard?village=VIL-DAR-HAY', w: 1440, h: 900, waitMs: 4500 },
  { name: '02_live_flood_risk_radar.png', url: 'http://127.0.0.1:3000/live-risk', w: 1440, h: 900, waitMs: 4500 },
  { name: '03_historical_replay_t7.png', url: 'http://127.0.0.1:3000/historical-replay?date=2020-07-18', w: 1440, h: 900, waitMs: 5000 },
  { name: '04_historical_replay_t0_peak.png', url: 'http://127.0.0.1:3000/historical-replay?date=2020-07-25', w: 1440, h: 900, waitMs: 5000 },
  { name: '05_portfolio_exposure_scatter.png', url: 'http://127.0.0.1:3000/portfolio', w: 1440, h: 900, waitMs: 4000 },
];

async function main() {
  console.log(`Starting headless Chrome for screenshots...`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=9333',
    '--window-size=1440,900',
    'about:blank'
  ], { detached: false });

  let version = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch('http://127.0.0.1:9333/json/version');
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!version) {
    console.error('Failed to connect to Chrome CDP on port 9333');
    chromeProc.kill();
    process.exit(1);
  }
  console.log('Connected to Chrome via CDP:', version.Browser);

  const newTargetRes = await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === msgId) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log(`Starting automated capture of ${requiredShots.length} screenshots...`);

  for (let i = 0; i < requiredShots.length; i++) {
    const s = requiredShots[i];
    const outFile = path.join(outDir, s.name);
    console.log(`[${i + 1}/${requiredShots.length}] Navigating to ${s.url} (${s.w}x${s.h})...`);

    await send('Emulation.setDeviceMetricsOverride', {
      width: s.w,
      height: s.h,
      deviceScaleFactor: 1,
      mobile: s.w < 600,
    });

    await send('Page.navigate', { url: s.url });
    await new Promise(r => setTimeout(r, s.waitMs));

    const result = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(result.data, 'base64');
    fs.writeFileSync(outFile, buf);
    console.log(`   -> Saved ${s.name}: ${buf.length} bytes`);
  }

  console.log('\nAll required screenshots successfully captured and verified!');
  ws.close();
  chromeProc.kill();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (e) {}
}

main().catch(err => {
  console.error('Fatal error in capture script:', err);
  process.exit(1);
});
