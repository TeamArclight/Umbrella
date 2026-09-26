// End-to-End API Integration Verification
import assert from 'node:assert';

console.log('🚀 Running E2E API Verification against running FastAPI backend on http://127.0.0.1:8000...\n');

const BASE_URL = 'http://127.0.0.1:8000';

async function testEndpoint(endpoint, validator) {
  const url = `${BASE_URL}${endpoint}`;
  process.stdout.write(`Testing ${endpoint}... `);
  const res = await fetch(url);
  assert.strictEqual(res.status, 200, `Expected 200 OK from ${url} but got ${res.status}`);
  const data = await res.json();
  if (validator) {
    validator(data);
  }
  console.log('✓ OK');
  return data;
}

async function runAll() {
  try {
    // 1. Health
    await testEndpoint('/api/v1/health', (data) => {
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.model_version, 'Flood Hazard Model v1.0');
    });

    // 2. Attribution
    await testEndpoint('/api/v1/attribution', (data) => {
      assert.ok(data.open_meteo);
      assert.ok(data.cgiar_climate);
      assert.ok(data.portfolio_data);
      assert.strictEqual(data.portfolio_data.data_type, 'SYNTHETIC');
    });

    // 3. Pilot Geography
    await testEndpoint('/api/v1/geography/pilot', (data) => {
      assert.strictEqual(data.pilot_district || data.district, 'Darbhanga');
      assert.strictEqual(data.pilot_state || data.state, 'Bihar');
      const clusters = data.monitored_clusters || data.operational_clusters;
      assert.strictEqual(clusters.length, 10);
    });

    // 4. District Boundary GeoJSON
    await testEndpoint('/api/v1/geography/district/darbhanga', (data) => {
      assert.strictEqual(data.type, 'FeatureCollection');
      assert.ok(data.features.length > 0);
    });

    // 5. Cluster Points GeoJSON
    await testEndpoint('/api/v1/geography/district/darbhanga/villages', (data) => {
      assert.strictEqual(data.type, 'FeatureCollection');
      assert.strictEqual(data.features.length, 10);
    });

    // 6. Complete Pipeline Batch Run across all monitored villages (10 in Darbhanga + 4 baseline)
    await testEndpoint('/api/v1/pipeline/run-all?horizon=5&month=7', (data) => {
      assert.ok(data.length >= 10, `Expected at least 10 evaluated villages, got ${data.length}`);
      const darbhangaCount = data.filter((d) => d.district === 'Darbhanga').length;
      assert.strictEqual(darbhangaCount, 10, `Expected 10 Darbhanga clusters, got ${darbhangaCount}`);
      data.forEach((item) => {
        assert.ok(item.village_id);
        assert.ok(item.flood_hazard);
        assert.ok(item.flood_hazard.components.length === 5);
        assert.strictEqual(item.portfolio_exposure.data_type, 'SYNTHETIC');
        assert.ok(item.portfolio_impact.priority_score >= 0);
      });
    });

    // 7. Historical Disaster Event Registry
    await testEndpoint('/api/v1/events', (data) => {
      assert.ok(Array.isArray(data));
      assert.ok(data.some((e) => e.event_id === 'IND-BIH-2020-07'));
    });

    // 8. Event Details
    await testEndpoint('/api/v1/events/IND-BIH-2020-07', (data) => {
      assert.strictEqual(data.district, 'Darbhanga');
      assert.strictEqual(data.peak_date, '2020-07-24');
      const gauges = data.cwc_gauges || data.hydrological_context?.cwc_gauge_stations;
      assert.ok(gauges && gauges.length >= 3);
    });

    // 9. District Event Replay Snapshot
    await testEndpoint('/api/v1/events/IND-BIH-2020-07/replay?lookback_days=5&snapshot_date=2020-07-25', (data) => {
      assert.strictEqual(data.evaluation_snapshot_date || data.snapshot_date, '2020-07-25');
      const clusters = data.clusters || data.cluster_evaluations;
      assert.strictEqual(clusters.length, 10);
    });

    // 10. Multi-Snapshot Village Replay Report
    await testEndpoint('/api/v1/events/IND-BIH-2020-07/replay/VIL-DAR-HAY?lookback_days=5', (data) => {
      assert.strictEqual(data.snapshots.length, 6);
      assert.ok(data.leakage_prevention_audit);
      assert.ok(data.decoupling_audit);
    });

    // 11. Remote Sensing & CWC Observational Evidence
    await testEndpoint('/api/v1/events/IND-BIH-2020-07/evidence', (data) => {
      assert.strictEqual(data.status, 'EVIDENCE_AVAILABLE_NOT_PROCESSED');
      assert.ok(data.sar_acquisitions.length >= 4);
      assert.ok(data.cwc_gauge_records.length >= 3);
    });

    console.log('\n🎉 ALL 11 END-TO-END REST ENDPOINTS VERIFIED & PASSING!\n');
  } catch (err) {
    console.error('\n❌ E2E API Verification failed:', err);
    process.exit(1);
  }
}

runAll();
