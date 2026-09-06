'use client';

/**
 * PDF editor baker. Takes the original file plus a flat list of annotations
 * (text, whiteout, highlight, rectangle, freehand ink, image/signature) and
 * stamps them onto the page content with pdf-lib.
 *
 * Geometry contract: every annotation is expressed in **fractions (0..1) of the
 * displayed page box** — i.e. the page as pdf.js renders it, with the page's own
 * /Rotate already applied, origin at the top-left, y growing downward. The baker
 * converts those fractions to PDF user space (origin bottom-left, points) and
 * accounts for page rotation. Storing fractions keeps the editor UI free of any
 * DPI / zoom bookkeeping — what the user sees is what gets stamped.
 */

import {
  PDFDocument,
  StandardFonts,
  LineCapStyle,
  rgb,
  degrees,
  type PDFFont,
  type RGB,
} from 'pdf-lib';

export type FontFamily = 'sans' | 'serif' | 'mono';
export type Rotation = 0 | 90 | 180 | 270;

export interface Point {
  /** 0..1 across the displayed page width. */
  x: number;
  /** 0..1 down the displayed page height. */
  y: number;
}

interface Base {
  id: string;
  /** 1-based page number. */
  page: number;
  /**
   * Links annotations that were created together (e.g. an "Edit text" click adds
   * a whiteout + a text box). The editor removes a whole group at once; the baker
   * ignores this field.
   */
  groupId?: string;
}

export interface TextAnnotation extends Base {
  type: 'text';
  /** Top-left of the text box, as a fraction of the displayed page. */
  x: number;
  y: number;
  text: string;
  /** Font size in PDF points. */
  sizePt: number;
  color: string;
  font: FontFamily;
  bold: boolean;
}

export interface BoxAnnotation extends Base {
  type: 'whiteout' | 'highlight' | 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** highlight / rect fill opacity (0..1). Ignored for whiteout. */
  opacity?: number;
  /** rect only — outline instead of fill. */
  outline?: boolean;
  /** rect outline width in points. */
  strokePt?: number;
}

export interface DrawAnnotation extends Base {
  type: 'draw';
  points: Point[];
  color: string;
  /** Stroke width in points. */
  strokePt: number;
}

export interface ImageAnnotation extends Base {
  type: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  /** A `data:image/(png|jpeg);base64,…` URL. */
  data: string;
}

export type Annotation = TextAnnotation | BoxAnnotation | DrawAnnotation | ImageAnnotation;

export interface ApplyResult {
  bytes: Uint8Array;
  /** Non-fatal issues — e.g. characters the built-in fonts cannot render. */
  warnings: string[];
}

/* -------------------------------------------------------------------------- */
/*  Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Map a point given as fractions of the *displayed* (rotation-applied) page box
 * to PDF user-space coordinates (origin bottom-left, points).
 *
 * `pageW` / `pageH` are the page's UN-rotated size from `page.getSize()`. The
 * four cases are the inverse of pdf.js's PageViewport transform.
 */
export function fracPointToPdf(
  rotation: Rotation,
  pageW: number,
  pageH: number,
  fx: number,
  fy: number,
): { x: number; y: number } {
  const sideways = rotation === 90 || rotation === 270;
  const viewW = sideways ? pageH : pageW;
  const viewH = sideways ? pageW : pageH;
  const vx = fx * viewW;
  const vy = fy * viewH;
  switch (rotation) {
    case 90:
      return { x: vy, y: vx };
    case 180:
      return { x: pageW - vx, y: vy };
    case 270:
      return { x: pageW - vy, y: pageH - vx };
    default:
      return { x: vx, y: pageH - vy };
  }
}

/**
 * Inverse of {@link fracPointToPdf}: a point in PDF user space (origin
 * bottom-left, points) → fractions of the displayed (rotation-applied) page box.
 */
export function pdfPointToFrac(
  rotation: Rotation,
  pageW: number,
  pageH: number,
  x: number,
  y: number,
): { fx: number; fy: number } {
  const sideways = rotation === 90 || rotation === 270;
  const viewW = sideways ? pageH : pageW;
  const viewH = sideways ? pageW : pageH;
  let vx: number;
  let vy: number;
  switch (rotation) {
    case 90:
      vx = y;
      vy = x;
      break;
    case 180:
      vx = pageW - x;
      vy = y;
      break;
    case 270:
      vx = pageH - y;
      vy = pageW - x;
      break;
    default:
      vx = x;
      vy = pageH - y;
  }
  return { fx: vx / viewW, fy: vy / viewH };
}

/** Axis-aligned PDF-space rectangle for a fractional box (top-left origin). */
export function fracBoxToPdf(
  rotation: Rotation,
  pageW: number,
  pageH: number,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
): { x: number; y: number; width: number; height: number } {
  const a = fracPointToPdf(rotation, pageW, pageH, fx, fy);
  const b = fracPointToPdf(rotation, pageW, pageH, fx + fw, fy + fh);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/* -------------------------------------------------------------------------- */
/*  Colour + text helpers                                                      */
/* -------------------------------------------------------------------------- */

function hexToRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return rgb(0, 0, 0);
  return rgb(parseInt(m[1]!, 16) / 255, parseInt(m[2]!, 16) / 255, parseInt(m[3]!, 16) / 255);
}

// Characters above U+00FF that the standard (WinAnsi) fonts can still encode.
const EXTRA_WINANSI = new Set<number>([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

/**
 * The built-in PDF fonts only speak WinAnsi (≈ Latin-1). Swap the rupee sign for
 * "Rs." and replace anything else unrenderable with "?", reporting what went.
 */
function sanitize(input: string): { text: string; dropped: string[] } {
  const dropped = new Set<string>();
  const text = Array.from(input.replace(/₹/g, 'Rs.'))
    .map((ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      const c = ch.codePointAt(0)!;
      if (c >= 0x20 && c <= 0x7e) return ch;
      if (c >= 0xa0 && c <= 0xff) return ch;
      if (EXTRA_WINANSI.has(c)) return ch;
      dropped.add(ch);
      return '?';
    })
    .join('');
  return { text, dropped: [...dropped] };
}

function standardFont(family: FontFamily, bold: boolean): StandardFonts {
  if (family === 'serif') return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman;
  if (family === 'mono') return bold ? StandardFonts.CourierBold : StandardFonts.Courier;
  return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; kind: 'png' | 'jpg' } {
  const m = /^data:image\/(png|jpe?g);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl.trim());
  if (!m) throw new Error('That image could not be read. Use a PNG or JPG file.');
  const kind: 'png' | 'jpg' = m[1]!.toLowerCase().startsWith('jp') ? 'jpg' : 'png';
  const binary = atob(m[2]!.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, kind };
}

/* -------------------------------------------------------------------------- */
/*  Baker                                                                      */
/* -------------------------------------------------------------------------- */

export async function applyPdfEdits(
  data: ArrayBuffer,
  annotations: Annotation[],
): Promise<ApplyResult> {
  const doc = await PDFDocument.load(data);
  doc.setProducer('Cygnatrix Tools');
  const pages = doc.getPages();
  const warnings: string[] = [];

  const fontCache = new Map<string, PDFFont>();
  const getFont = async (family: FontFamily, bold: boolean): Promise<PDFFont> => {
    const key = `${family}-${bold}`;
    let font = fontCache.get(key);
    if (!font) {
      font = await doc.embedFont(standardFont(family, bold));
      fontCache.set(key, font);
    }
    return font;
  };

  for (const a of annotations) {
    const page = pages[a.page - 1];
    if (!page) {
      throw new Error(`An edit points at page ${a.page}, which this document does not have.`);
    }
    const { width: pw, height: ph } = page.getSize();
    const rotation = ((((page.getRotation().angle % 360) + 360) % 360) || 0) as Rotation;

    if (a.type === 'text') {
      if (!a.text.trim()) continue;
      const { text, dropped } = sanitize(a.text);
      if (dropped.length) {
        warnings.push(
          `The built-in fonts can't draw ${dropped.map((d) => `"${d}"`).join(', ')} — shown as "?".`,
        );
      }
      const font = await getFont(a.font, a.bold);
      const sideways = rotation === 90 || rotation === 270;
      const viewH = sideways ? pw : ph;
      // Fractional click point is the box's top-left; nudge down to the baseline.
      const baselineFy = a.y + (a.sizePt * 0.8) / viewH;
      const p = fracPointToPdf(rotation, pw, ph, a.x, baselineFy);
      page.drawText(text, {
        x: p.x,
        y: p.y,
        size: a.sizePt,
        font,
        color: hexToRgb(a.color),
        lineHeight: a.sizePt * 1.15,
        rotate: degrees(rotation),
      });
      continue;
    }

    if (a.type === 'whiteout' || a.type === 'highlight' || a.type === 'rect') {
      const box = fracBoxToPdf(rotation, pw, ph, a.x, a.y, a.w, a.h);
      if (box.width < 0.5 || box.height < 0.5) continue;
      const color = hexToRgb(a.color);
      if (a.type === 'rect' && a.outline) {
        page.drawRectangle({
          ...box,
          opacity: 0,
          borderColor: color,
          borderWidth: a.strokePt ?? 1.5,
          borderOpacity: a.opacity ?? 1,
        });
      } else {
        const opacity =
          a.type === 'whiteout' ? 1 : a.opacity ?? (a.type === 'highlight' ? 0.35 : 1);
        page.drawRectangle({ ...box, color, opacity });
      }
      continue;
    }

    if (a.type === 'draw') {
      if (a.points.length < 2) continue;
      const color = hexToRgb(a.color);
      const pts = a.points.map((pt) => fracPointToPdf(rotation, pw, ph, pt.x, pt.y));
      for (let i = 1; i < pts.length; i += 1) {
        page.drawLine({
          start: pts[i - 1]!,
          end: pts[i]!,
          thickness: a.strokePt,
          color,
          lineCap: LineCapStyle.Round,
        });
      }
      continue;
    }

    if (a.type === 'image') {
      const { bytes: imgBytes, kind } = dataUrlToBytes(a.data);
      const image = kind === 'png' ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      const box = fracBoxToPdf(rotation, pw, ph, a.x, a.y, a.w, a.h);
      if (box.width < 1 || box.height < 1) continue;
      page.drawImage(image, box);
    }
  }

  const bytes = await doc.save();
  return { bytes, warnings: [...new Set(warnings)] };
}
