// src/lib/cluster-layout.ts

/**
 * Geometric and layout constants for the OmniBrain Constellation Canvas.
 * Verified to guarantee zero overlapping cards and accessibility compliance.
 */
export const CARD_WIDTH = 140;
export const CARD_HEIGHT = 44; // WCAG / iOS minimum touch target height
export const UNIFORM_ORBIT_RADIUS = 200; // Radius from cluster hub center to satellite card centers
export const HUB_RADIUS = 24; // Central hub sphere radius
export const HUB_RADAR_RADIUS = 80; // Outer radar perimeter ring
export const CLUSTER_DISTANCE_SCALE = 500; // Radial distance scalar for phyllotaxis distribution
export const MAX_RING_CAPACITY = 8; // Exactly 8 discrete compass slots (N, NE, E, SE, S, SW, W, NW)

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SatellitePosition {
  slotIndex: number;
  x: number;
  y: number;
  theta: number;
  rect: Rect;
}

/**
 * Deterministic phyllotaxis slot generator for Cluster Hubs.
 * Uses Fermat's spiral with golden-angle dispersion to guarantee D_hub >= 500px
 * between nearest neighbors, without ever shifting existing clusters when a new one is added.
 */
export function getClusterAnchor(slotIndex: number): Point {
  if (slotIndex <= 0) return { x: 0, y: 0 };

  const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180);
  const radius = CLUSTER_DISTANCE_SCALE * Math.sqrt(slotIndex);
  const theta = slotIndex * GOLDEN_ANGLE;

  return {
    x: Math.round(radius * Math.cos(theta)),
    y: Math.round(radius * Math.sin(theta)),
  };
}

/**
 * Computes the center coordinates, angle, and bounding box for a satellite card slot (0 to 7)
 * around a given cluster hub center.
 *
 * Slot 0: North (0, -200)
 * Slot 1: North-East (141.42, -141.42)
 * Slot 2: East (200, 0)
 * Slot 3: South-East (141.42, 141.42)
 * Slot 4: South (0, 200)
 * Slot 5: South-West (-141.42, 141.42)
 * Slot 6: West (-200, 0)
 * Slot 7: North-West (-141.42, -141.42)
 */
export function getSatelliteSlot(slotIndex: number, hubAnchor: Point): SatellitePosition {
  const normalizedSlot = ((slotIndex % MAX_RING_CAPACITY) + MAX_RING_CAPACITY) % MAX_RING_CAPACITY;
  // Offset by -PI/2 so slot 0 is straight North
  const theta = (normalizedSlot * Math.PI) / 4 - Math.PI / 2;

  const x = Math.round((hubAnchor.x + UNIFORM_ORBIT_RADIUS * Math.cos(theta)) * 100) / 100;
  const y = Math.round((hubAnchor.y + UNIFORM_ORBIT_RADIUS * Math.sin(theta)) * 100) / 100;

  const halfW = CARD_WIDTH / 2;
  const halfH = CARD_HEIGHT / 2;

  return {
    slotIndex: normalizedSlot,
    x,
    y,
    theta,
    rect: {
      minX: x - halfW,
      maxX: x + halfW,
      minY: y - halfH,
      maxY: y + halfH,
    },
  };
}

/**
 * Tests whether two axis-aligned bounding box rectangles overlap.
 * An optional margin can be specified (e.g. to require a minimum gap between cards).
 */
export function doRectanglesOverlap(r1: Rect, r2: Rect, margin: number = 0): boolean {
  // If one rectangle is strictly to the left of the other (with margin)
  if (r1.maxX + margin <= r2.minX || r2.maxX + margin <= r1.minX) {
    return false;
  }
  // If one rectangle is strictly above the other (with margin)
  if (r1.maxY + margin <= r2.minY || r2.maxY + margin <= r1.minY) {
    return false;
  }
  return true;
}

/**
 * Resolves which items are rendered directly onto the 8 ring slots and which are placed in overflow.
 *
 * Rule:
 * - If items.length <= 8: All items occupy fixed slots 0..(N-1). overflowCount = 0.
 * - If items.length > 8: The first 7 items occupy slots 0..6. Slot 7 is reserved for the '+N more' card.
 */
export function getClusterDisplaySlots<T>(items: T[]): {
  visibleItems: Array<{ item: T; slotIndex: number }>;
  overflowCount: number;
  overflowItems: T[];
  hasOverflow: boolean;
} {
  if (items.length <= MAX_RING_CAPACITY) {
    return {
      visibleItems: items.map((item, slotIndex) => ({ item, slotIndex })),
      overflowCount: 0,
      overflowItems: [],
      hasOverflow: false,
    };
  }

  // N > 8: Slots 0..6 hold items, Slot 7 is reserved for the overflow pill
  const visible = items.slice(0, 7).map((item, slotIndex) => ({ item, slotIndex }));
  const overflow = items.slice(7);

  return {
    visibleItems: visible,
    overflowCount: overflow.length,
    overflowItems: overflow,
    hasOverflow: true,
  };
}
