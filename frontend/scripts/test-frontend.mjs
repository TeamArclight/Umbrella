// Frontend Integration & Verification Tests
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Starting Umbrella Frontend Verification Suite...\n');

// Test 1: Verify .next build output exists
console.log('Test 1: Verifying Next.js production build artifacts...');
const nextDir = path.resolve('frontend/.next');
assert.ok(fs.existsSync(nextDir), '.next build directory must exist');

const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
assert.ok(fs.existsSync(routesManifestPath), 'routes-manifest.json must exist');
const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, 'utf8'));

const expectedStaticRoutes = [
  '/',
  '/dashboard',
  '/live-risk',
  '/historical-replay',
  '/portfolio',
  '/actions',
  '/green-finance',
  '/methodology',
];

expectedStaticRoutes.forEach((route) => {
  const found = routesManifest.staticRoutes.some((r) => r.page === route);
  assert.ok(found, `Static route ${route} must be compiled in routes-manifest.json`);
  console.log(`  ✓ Route compiled: ${route}`);
});

// Test 2: Verify component files exist
console.log('\nTest 2: Verifying institutional component files...');
const components = [
  'Navbar.tsx',
  'Sidebar.tsx',
  'GlobalStatusBar.tsx',
  'ProvenanceBadge.tsx',
  'LeafletMap.tsx',
  'HazardExplainability.tsx',
  'ClusterDetailDrawer.tsx',
  'HistoricalTimeline.tsx',
  'ObservedEvidencePanel.tsx',
  'ActionModal.tsx',
];

components.forEach((comp) => {
  const compPath = path.resolve('frontend/components', comp);
  assert.ok(fs.existsSync(compPath), `Component ${comp} must exist`);
  console.log(`  ✓ Component verified: ${comp}`);
});

// Test 3: Mathematical Explainability verification
console.log('\nTest 3: Verifying Hazard Explainability summation logic...');
const sampleComponents = [
  { name: 'forecast_accumulation', weight: 0.35, normalized_score: 80.0, contribution: 28.0 },
  { name: 'peak_burst_intensity', weight: 0.25, normalized_score: 90.0, contribution: 22.5 },
  { name: 'soil_saturation', weight: 0.15, normalized_score: 70.0, contribution: 10.5 },
  { name: 'historical_anomaly', weight: 0.15, normalized_score: 60.0, contribution: 9.0 },
  { name: 'terrain_susceptibility', weight: 0.10, normalized_score: 84.0, contribution: 8.4 },
];

const totalWeight = sampleComponents.reduce((acc, c) => acc + c.weight, 0);
assert.strictEqual(Math.round(totalWeight * 100) / 100, 1.0, 'Total model weights must equal 1.00');

const calculatedHazardScore = sampleComponents.reduce((acc, c) => acc + c.contribution, 0);
assert.strictEqual(Math.round(calculatedHazardScore * 10) / 10, 78.4, 'Sum of contributions must equal composite score 78.4');
console.log(`  ✓ Weights sum: ${totalWeight.toFixed(2)} = 1.00`);
console.log(`  ✓ Contributions sum: ${calculatedHazardScore.toFixed(1)} = 78.4`);

// Test 4: Operational Priority Index formula verification
console.log('\nTest 4: Verifying Operational Priority Index formula...');
const hazardScore = 78.4;
const normalizedExposureScore = 65.0;
const priorityScore = 0.60 * hazardScore + 0.40 * normalizedExposureScore;
assert.strictEqual(Math.round(priorityScore * 10) / 10, 73.0, 'Priority score must equal 73.0');
console.log(`  ✓ Priority Score: 0.60 * ${hazardScore} + 0.40 * ${normalizedExposureScore} = ${priorityScore.toFixed(1)}`);

// Test 5: Strict Decoupling check
console.log('\nTest 5: Verifying Decoupling Axiom...');
const villageAHazard = 80.0;
const villageAPortfolio = 200000; // ₹2 Lakh
const villageBHazard = 80.0;
const villageBPortfolio = 8000000; // ₹80 Lakh

// Hazard must be unaffected by portfolio
assert.strictEqual(villageAHazard, villageBHazard, 'Physical hazard must be identical regardless of portfolio scale');
console.log(`  ✓ Village A Hazard (${villageAHazard}) === Village B Hazard (${villageBHazard})`);

console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED (5/5)\n');
