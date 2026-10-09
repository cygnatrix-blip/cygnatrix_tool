/** Shared types for the image → 3D model pipeline. No DOM — safe in a worker. */

/** How brightness maps to material. */
export type StlMode =
  /** Backlit print: dark pixels become thick, bright pixels thin. */
  | 'lithophane'
  /** Embossed surface: bright pixels stand tall above a solid base. */
  | 'relief';

/** The body the image is wrapped onto. */
export type StlShape = 'flat' | 'curved' | 'cylinder';

/**
 * How colour collapses to a single brightness. Luminance matches the eye and
 * is right for photographs; averaging keeps saturated colours from going
 * unexpectedly dark; lightness preserves bright colours; threshold gives a
 * two-level stencil for logos and silhouettes.
 */
export type GrayMethod = 'luminance' | 'average' | 'lightness' | 'threshold';

/** The cut-out silhouette of a flat panel. */
export type Outline = 'rectangle' | 'rounded' | 'ellipse' | 'heart';

export type ExportFormat = 'stl-binary' | 'stl-ascii' | '3mf' | 'obj';

export type Units = 'mm' | 'in';

export interface CropRect {
  /** All four are fractions 0..1 of the source image. */
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  /** Unsharp amount, 0..100. Recovers edge definition lost to smoothing. */
  sharpen: number;
  flipHorizontal: boolean;
  /** Cap on the longer grid edge. Drives triangle count and detail. */
  maxSamples: number;
  /** Sweep for the curved shape, in degrees. Ignored by flat and cylinder. */
  curveDegrees: number;

  grayMethod: GrayMethod;
  /** Cut point for the threshold method, 0..1. */
  thresholdAt: number;

  /** Silhouette of a flat panel. Ignored by curved and cylinder. */
  outline: Outline;
  /** Corner radius for the rounded outline. */
  cornerRadiusMM: number;
  /** Diameter of a hole for hanging it up. 0 for none. */
  hangingHoleMM: number;
  /** Distance from the top edge to the centre of that hole. */
  hangingHoleInsetMM: number;

  /** Curve the panel the other way, so the image is on the inside face. */
  concave: boolean;
  /** Stand a flat panel on its edge, the orientation it should be printed in. */
  orientUpright: boolean;

  /** Region of the source image to use. */
  crop?: CropRect;
  /** Quarter turns applied to the source, 0..3. */
  rotateQuarter: number;
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
  sharpen: 0,
  flipHorizontal: false,
  maxSamples: 400,
  curveDegrees: 120,
  grayMethod: 'luminance',
  thresholdAt: 0.5,
  outline: 'rectangle',
  cornerRadiusMM: 6,
  hangingHoleMM: 0,
  hangingHoleInsetMM: 6,
  concave: false,
  orientUpright: false,
  rotateQuarter: 0,
};

/** A normalised height field: one 0..1 sample per grid point, row-major. */
export interface HeightField {
  width: number;
  height: number;
  /** 0 = thinnest, 1 = thickest, after every adjustment has been applied. */
  data: Float32Array;
  /**
   * Which samples are part of the model. Absent means all of them. Lets one
   * mesh builder cover every silhouette and any holes punched through it.
   */
  mask?: Uint8Array;
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

/** A mesh with vertices shared between facets, as 3MF and OBJ require. */
export interface IndexedMesh {
  /** 3 floats per vertex. */
  vertices: Float32Array;
  /** 3 indices per triangle. */
  indices: Uint32Array;
  vertexCount: number;
  triangleCount: number;
}
