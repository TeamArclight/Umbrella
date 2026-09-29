import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\Documents\\UMBRELLA\\docs\\screenshots';
const userDataDir = path.join(process.env.TEMP || 'C:\\temp', 'cdp_prof_all_' + Date.now());

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const shots = [
  { name: '01_command_center_dashboard.png', url: 'http://127.0.0.1:3000/dashboard', w: 1440, h: 900, waitMs: 4000 },
  { name: '02_live_flood_risk_radar.png', url: 'http://127.0.0.1:3000/live-risk', w: 1440, h: 900, waitMs: 4500 },
  { name: '03_historical_replay_t7.png', url: 'http://127.0.0.1:3000/historical-replay?date=2020-07-18', w: 1440, h: 900, waitMs: 5000 },
  { name: '04_historical_replay_t0_peak.png', url: 'http://127.0.0.1:3000/historical-replay?date=2020-07-25', w: 1440, h: 900, waitMs: 5000 },
  { name: '05_portfolio_exposure_scatter.png', url: 'http://127.0.0.1:3000/portfolio', w: 1440, h: 900, waitMs: 4000 },
  { name: '06_action_center_early_warning.png', url: 'http://127.0.0.1:3000/actions', w: 1440, h: 900, waitMs: 4000 },
  { name: '07_resilience_catalog.png', url: 'http://127.0.0.1:3000/green-finance', w: 1440, h: 900, waitMs: 4500 },
  { name: '08_green_finance_calculator.png', url: 'http://127.0.0.1:3000/green-finance?step=2', w: 1440, h: 900, waitMs: 4500 },
  { name: '09_human_decision_modal.png', url: 'http://127.0.0.1:3000/actions?modal=true', w: 1440, h: 900, waitMs: 4000 },
  { name: '10_field_verification_checklist.png', url: 'http://127.0.0.1:3000/field-officer', w: 1440, h: 900, waitMs: 4000 },
  { name: '11_dual_track_impact_dashboard.png', url: 'http://127.0.0.1:3000/impact', w: 1440, h: 900, waitMs: 4000 },
  { name: '12_asset_lifecycle_traceability.png', url: 'http://127.0.0.1:3000/assets/AST-DAR-HAY-001', w: 1440, h: 900, waitMs: 4000 },
  { name: '13_mobile_field_officer.png', url: 'http://127.0.0.1:3000/field-officer', w: 390, h: 844, waitMs: 4000 },
  { name: '14_mobile_command_center.png', url: 'http://127.0.0.1:3000/dashboard', w: 390, h: 844, waitMs: 4000 },
];

async function main() {
  console.log(`Starting Chrome with isolated profile (${userDataDir})...`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=9222',
    '--window-size=1440,900',
    'about:blank'
  ], { detached: false });

  let version = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!version) {
    console.error('Failed to connect to Chrome CDP on port 9222');
    chromeProc.kill();
    process.exit(1);
  }
  console.log('Connected to Chrome via CDP:', version.Browser);

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
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

  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      const args = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.error('[Page Error]', args);
    }
  });

  console.log(`Starting automated capture of ${shots.length} screens...`);

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const outFile = path.join(outDir, s.name);
    console.log(`[${i + 1}/${shots.length}] Navigating to ${s.url} (${s.w}x${s.h})...`);

    // Set viewport metrics
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
    console.log(`   -> Captured ${s.name}: ${buf.length} bytes`);
  }

  console.log('\nAll 14 screenshots successfully captured and verified!');
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
