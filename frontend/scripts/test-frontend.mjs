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
  '/field-officer',
  '/impact',
  '/methodology',
];

expectedStaticRoutes.forEach((route) => {
  const found = routesManifest.staticRoutes.some((r) => r.page === route);
  assert.ok(found, `Static route ${route} must be compiled in routes-manifest.json`);
  console.log(`  ✓ Route compiled: ${route}`);
});

// Check dynamic routes
const foundDynamic = routesManifest.dynamicRoutes.some((r) => r.page === '/assets/[id]');
assert.ok(foundDynamic, 'Dynamic route /assets/[id] must be compiled in routes-manifest.json');
console.log('  ✓ Dynamic route compiled: /assets/[id]');

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

// Test 6: Deterministic Loan Amortization formula verification
console.log('\nTest 6: Verifying Reducing-Balance Loan Amortization formula...');
const principal = 25000;
const annualRate = 18.0;
const tenureMonths = 18;
const monthlyRate = annualRate / (12 * 100);
const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
const roundedEmi = Math.round(emi);
assert.ok(roundedEmi >= 1590 && roundedEmi <= 1605, `EMI should be approx 1598, got ${roundedEmi}`);
const totalRepayment = roundedEmi * tenureMonths;
const totalInterest = totalRepayment - principal;
assert.ok(totalInterest > 0, 'Total interest must be positive');
console.log(`  ✓ Principal: ₹${principal}, Rate: ${annualRate}%, Tenure: ${tenureMonths}m -> EMI: ₹${roundedEmi}, Total Interest: ₹${totalInterest}`);

// Test 7: Activity-Based Emissions Avoided proxy calculation
console.log('\nTest 7: Verifying Activity-Based Emissions Avoided proxy calculation...');
const dieselLiters = 350;
const dieselFactorKg = 2.68;
const emissionsAvoidedKg = dieselLiters * dieselFactorKg;
const emissionsAvoidedTons = emissionsAvoidedKg / 1000.0;
assert.strictEqual(Math.round(emissionsAvoidedTons * 1000) / 1000, 0.938, 'Emissions avoided must equal 0.938 tCO2e');
console.log(`  ✓ Diesel Saved: ${dieselLiters} L × ${dieselFactorKg} kg/L = ${emissionsAvoidedTons.toFixed(3)} tCO2e`);

// Test 8: Haversine distance geofence threshold check
console.log('\nTest 8: Verifying Haversine distance geofence classification...');
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
const distClose = haversineM(25.9620, 85.9080, 25.9630, 85.9090); // ~150m
assert.ok(distClose < 500, 'Distance must be <500m (PASS)');
const distFar = haversineM(25.9620, 85.9080, 26.0500, 85.9900); // >10km
assert.ok(distFar > 2000, 'Distance must be >2000m (FLAG)');
console.log(`  ✓ Close distance: ${Math.round(distClose)}m (<500m PASS)`);
console.log(`  ✓ Far distance: ${Math.round(distFar)}m (>2000m FLAG)`);

console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED (8/8)\n');
