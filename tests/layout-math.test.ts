// tests/layout-math.test.ts
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  UNIFORM_ORBIT_RADIUS,
  HUB_RADAR_RADIUS,
  getClusterAnchor,
  getSatelliteSlot,
  doRectanglesOverlap,
  getClusterDisplaySlots,
  type Rect,
} from '../src/lib/cluster-layout.ts';

function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING PROPERTY TESTS: CONSTELLATION LAYOUT MATH');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string, verbose = true) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      process.exit(1);
    }
    if (verbose) {
      console.log(`✅ PASSED: ${message}`);
    }
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 1: Within-Cluster Rectangle Clearance for all 8 Satellite Slots
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing Within-Cluster Satellite Card Clearances (R = 200px) ---');
  const hubCenter = { x: 0, y: 0 };
  const slots = Array.from({ length: 8 }, (_, i) => getSatelliteSlot(i, hubCenter));

  let minAdjacentVerticalGap = Infinity;
  let minAdjacentHorizontalGap = Infinity;

  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const r1 = slots[i].rect;
      const r2 = slots[j].rect;
      const overlap = doRectanglesOverlap(r1, r2);
      assert(!overlap, `Slot ${i} and Slot ${j} must not overlap`);

      // If adjacent slots (e.g. 0 and 1)
      if (Math.abs(i - j) === 1 || Math.abs(i - j) === 7) {
        const vGap = Math.max(r1.minY - r2.maxY, r2.minY - r1.maxY);
        const hGap = Math.max(r1.minX - r2.maxX, r2.minX - r1.maxX);
        if (vGap > 0) minAdjacentVerticalGap = Math.min(minAdjacentVerticalGap, vGap);
        if (hGap > 0) minAdjacentHorizontalGap = Math.min(minAdjacentHorizontalGap, hGap);
      }
    }
  }

  console.log(`   [Metric] Minimum adjacent vertical clearance gap: ${minAdjacentVerticalGap.toFixed(2)}px`);
  assert(minAdjacentVerticalGap >= 14.5, `Minimum vertical clearance between cardinal & diagonal cards must be >= 14.5px (observed ${minAdjacentVerticalGap.toFixed(2)}px)`);

  // -------------------------------------------------------------------------
  // TEST 2: Radar Ring Visual Clearance (R_radar = 80px)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Radar Ring Clearance (Hub Radar R = 80px) ---');
  for (let i = 0; i < 8; i++) {
    const card = slots[i];
    // Closest point on the card to (0, 0)
    const closestX = Math.max(card.rect.minX, Math.min(0, card.rect.maxX));
    const closestY = Math.max(card.rect.minY, Math.min(0, card.rect.maxY));
    const closestDist = Math.sqrt(closestX * closestX + closestY * closestY);

    assert(
      closestDist > HUB_RADAR_RADIUS + 10,
      `Slot ${i} inner edge (${closestDist.toFixed(1)}px) must strictly clear 80px radar ring with >= 10px buffer`
    );
  }

  // -------------------------------------------------------------------------
  // TEST 3: Inter-Cluster Hub Distances & Full Card Expansion (First 60 Slots)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Inter-Cluster Distances & Non-Overlap (First 60 Cluster Slots) ---');
  const CLUSTER_COUNT = 60;
  const clusterAnchors = Array.from({ length: CLUSTER_COUNT }, (_, i) => getClusterAnchor(i));

  let minHubDistance = Infinity;
  let minPair = [0, 0];

  for (let i = 0; i < CLUSTER_COUNT; i++) {
    for (let j = i + 1; j < CLUSTER_COUNT; j++) {
      const a = clusterAnchors[i];
      const b = clusterAnchors[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist < minHubDistance) {
        minHubDistance = dist;
        minPair = [i, j];
      }
      assert(dist >= 500, `Distance between Cluster ${i} and Cluster ${j} must be >= 500px (observed ${dist.toFixed(1)}px)`, false);

      // Fully expand all 8 cards around Cluster i and all 8 cards around Cluster j
      const cardsI = Array.from({ length: 8 }, (_, k) => getSatelliteSlot(k, a).rect);
      const cardsJ = Array.from({ length: 8 }, (_, k) => getSatelliteSlot(k, b).rect);

      for (const cI of cardsI) {
        for (const cJ of cardsJ) {
          const overlap = doRectanglesOverlap(cI, cJ);
          assert(!overlap, `Expanded cards between Cluster ${i} and Cluster ${j} must never collide`, false);
        }
      }
    }
  }
  console.log(`✅ PASSED: All 1,770 cluster pairs maintain >= 500px spacing (min ${minHubDistance.toFixed(1)}px between #${minPair[0]} & #${minPair[1]})`);
  console.log(`✅ PASSED: All 113,280 expanded pairwise satellite card combinations verified collision-free`);

  // -------------------------------------------------------------------------
  // TEST 4: Slot Stability (Adding cluster k+1 never alters clusters 0..k)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Spatial Slot Invariance ---');
  const anchor0 = getClusterAnchor(0);
  const anchor1 = getClusterAnchor(1);
  const anchor2 = getClusterAnchor(2);

  assert(anchor0.x === 0 && anchor0.y === 0, 'Slot 0 is fixed at origin (0, 0)');
  assert(anchor1.x === -369 && anchor1.y === 338, `Slot 1 is deterministic at (-369, 338) (got ${anchor1.x}, ${anchor1.y})`);
  assert(anchor2.x === 62 && anchor2.y === -704, `Slot 2 is deterministic at (62, -704) (got ${anchor2.x}, ${anchor2.y})`);

  // -------------------------------------------------------------------------
  // TEST 5: Overflow Rule Verification (N <= 8 vs N > 8)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Ring Capacity & Overflow Rule ---');
  const items7 = Array.from({ length: 7 }, (_, i) => `item_${i}`);
  const res7 = getClusterDisplaySlots(items7);
  assert(res7.visibleItems.length === 7 && res7.overflowCount === 0 && !res7.hasOverflow, 'N=7: 7 visible items, 0 overflow');

  const items8 = Array.from({ length: 8 }, (_, i) => `item_${i}`);
  const res8 = getClusterDisplaySlots(items8);
  assert(res8.visibleItems.length === 8 && res8.overflowCount === 0 && !res8.hasOverflow, 'N=8: exactly 8 visible items (all slots full), 0 overflow');

  const items9 = Array.from({ length: 9 }, (_, i) => `item_${i}`);
  const res9 = getClusterDisplaySlots(items9);
  assert(res9.visibleItems.length === 7 && res9.overflowCount === 2 && res9.hasOverflow, 'N=9: 7 visible items, slot 7 overflow card holding 2 notes');

  const items25 = Array.from({ length: 25 }, (_, i) => `item_${i}`);
  const res25 = getClusterDisplaySlots(items25);
  assert(res25.visibleItems.length === 7 && res25.overflowCount === 18 && res25.hasOverflow, 'N=25: 7 visible items, slot 7 overflow card holding 18 notes');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('====================================================\n');
}

runTestSuite();
