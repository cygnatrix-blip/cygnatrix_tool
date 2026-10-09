/** Shared types for the image → STL pipeline. No DOM, no canvas — safe in a worker. */

/** How brightness maps to material. */
export type StlMode =
  /** Backlit print: dark pixels become thick, bright pixels thin. */
  | 'lithophane'
  /** Embossed surface: bright pixels stand tall above a solid base. */
  | 'relief';

/** The body the image is wrapped onto. */
export type StlShape = 'flat' | 'curved' | 'cylinder';

export interface StlOptions {
  mode: StlMode;
  shape: StlShape;
  /** Flat: plate width. Curved: arc length. Cylinder: outer circumference. */
  widthMM: number;
  /** Physical height; derived from the image's aspect ratio when omitted. */
  heightMM?: number;
  /** Thinnest material, at the brightest pixel. Must clear the nozzle width. */
  minThicknessMM: number;
  /** Thickest material, at the darkest pixel. */
  maxThicknessMM: number;
  /** Solid backing added under a relief, so it isn't just a thin skin. */
  baseThicknessMM: number;
  /** Solid frame around the edge, in mm. 0 for none. */
  borderMM: number;
  /** Swap light and dark. */
  invert: boolean;
  /** -100..100 */
  brightness: number;
  /** -100..100 */
  contrast: number;
  /** 0.1..4 — pulls midtones without clipping either end. */
  gamma: number;
  /** Box-blur radius in samples; smooths print-through noise. */
  smooth: number;
  flipHorizontal: boolean;
  /** Cap on the longer grid edge. Drives triangle count and detail. */
  maxSamples: number;
  /** Sweep for the curved shape, in degrees. Ignored by flat and cylinder. */
  curveDegrees: number;
}

export const DEFAULT_STL_OPTIONS: StlOptions = {
  mode: 'lithophane',
  shape: 'flat',
  widthMM: 100,
  minThicknessMM: 0.6,
  maxThicknessMM: 3,
  baseThicknessMM: 0,
  borderMM: 0,
  invert: false,
  brightness: 0,
  contrast: 0,
  gamma: 1,
  smooth: 1,
  flipHorizontal: false,
  maxSamples: 400,
  curveDegrees: 120,
};

/** A normalised height field: one 0..1 sample per grid point, row-major. */
export interface HeightField {
  width: number;
  height: number;
  /** 0 = brightest, 1 = darkest, after every adjustment has been applied. */
  data: Float32Array;
}

/**
 * A triangle soup. `positions` holds 9 floats per triangle (3 vertices × xyz)
 * and is the single source of truth — normals are derived from winding, so a
 * correctly wound mesh needs nothing else stored.
 */
export interface Mesh {
  positions: Float32Array;
  triangleCount: number;
}
