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

    // 12. Resilience Interventions Catalog
    await testEndpoint('/api/v1/interventions', (data) => {
      assert.strictEqual(data.length, 6, `Expected 6 interventions, got ${data.length}`);
      assert.ok(data.some((i) => i.intervention_id === 'raised-hermetic-silo'));
      assert.ok(data.some((i) => i.intervention_id === 'solar-irrigation-pump'));
    });

    // 13. Adaptation Recommendations for Hayaghat
    await testEndpoint('/api/v1/interventions/recommendations/VIL-DAR-HAY', (data) => {
      assert.strictEqual(data.village_id, 'VIL-DAR-HAY');
      assert.ok(data.recommendations.length > 0);
      assert.ok(data.recommendations[0].ranking_score > 0);
    });

    // 14. Indicative Green Finance Products
    await testEndpoint('/api/v1/green-finance/products', (data) => {
      assert.strictEqual(data.length, 3, `Expected 3 green finance products, got ${data.length}`);
      assert.ok(data.some((p) => p.finance_product_id === 'prod-micro-adaptation'));
    });

    // 15. Loan Amortization & Scenario Simulation
    const scenRes = await fetch(`${BASE_URL}/api/v1/green-finance/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intervention_cost_inr: 25000,
        borrower_contribution_inr: 2500,
        tenure_months: 18,
        annual_interest_rate_pct: 18.0,
      }),
    });
    assert.strictEqual(scenRes.status, 200);
    const scenData = await scenRes.json();
    assert.ok(scenData.estimated_installment_inr > 0);
    console.log(`Testing /api/v1/green-finance/scenarios... ✓ OK (EMI: ₹${scenData.estimated_installment_inr})`);

    // 16. Green Finance Applications
    await testEndpoint('/api/v1/green-finance/applications', (data) => {
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 4, `Expected at least 4 demo applications, got ${data.length}`);
    });

    // 17. Tracked Resilience Assets
    await testEndpoint('/api/v1/assets', (data) => {
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 2, `Expected at least 2 demo assets, got ${data.length}`);
    });

    // 18. Asset Verifications
    await testEndpoint('/api/v1/verifications', (data) => {
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 1, `Expected at least 1 demo verification, got ${data.length}`);
    });

    // 19. Portfolio Impact Summary
    await testEndpoint('/api/v1/impact', (data) => {
      assert.ok(data.total_applications >= 4);
      assert.ok(data.total_estimated_emissions_avoided_tco2e > 0);
      assert.ok(data.total_capital_deployed_inr > 0);
    });

    // 20. Impact Methodologies
    await testEndpoint('/api/v1/impact/methodologies', (data) => {
      assert.strictEqual(data.length, 2, `Expected 2 methodologies, got ${data.length}`);
      assert.ok(data.some((m) => m.methodology_id === 'UNFCCC-AMS-I.A'));
      assert.ok(data.some((m) => m.methodology_id === 'FAO-POST-HARVEST-2021'));
    });

    // 21. Carbon Price Scenario Sensitivity
    await testEndpoint('/api/v1/impact/scenario?emissions_avoided_tco2e=10.0&price_usd=20.0', (data) => {
      assert.strictEqual(data.estimated_emissions_avoided_tco2e, 10.0);
      assert.strictEqual(data.assumed_carbon_price_usd_per_tonne, 20.0);
      assert.strictEqual(data.illustrative_annual_value_usd, 200.0);
      assert.ok(data.illustrative_annual_value_inr > 0);
    });

    // 22. Audit Trail
    await testEndpoint('/api/v1/audit', (data) => {
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 5, `Expected at least 5 audit events, got ${data.length}`);
    });

    console.log('\n🎉 ALL 22 END-TO-END REST ENDPOINTS VERIFIED & PASSING!\n');
  } catch (err) {
    console.error('\n❌ E2E API Verification failed:', err);
    process.exit(1);
  }
}

runAll();
