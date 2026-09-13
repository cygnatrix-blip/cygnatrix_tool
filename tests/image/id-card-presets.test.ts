import { describe, expect, it } from 'vitest';
import { ID_CARD_PRESETS, getIdCardPreset } from '@/config/id-card-presets';
import { PASSPORT_PRESETS } from '@/config/passport-presets';

describe('ID_CARD_PRESETS', () => {
  it('has 4 presets with unique ids and a working lookup', () => {
    expect(ID_CARD_PRESETS).toHaveLength(4);
    const ids = new Set(ID_CARD_PRESETS.map((p) => p.id));
    expect(ids.size).toBe(4);
    expect(getIdCardPreset('pan-nsdl')?.name).toContain('NSDL');
    expect(getIdCardPreset('nope')).toBeUndefined();
  });

  it('every preset carries a verification date and a real https official URL', () => {
    for (const p of ID_CARD_PRESETS) {
      expect(p.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.officialUrl).toMatch(/^https:\/\//);
      expect(p.note.length).toBeGreaterThan(20);
    }
  });

  it('NSDL PAN photo is a portrait rectangle converted from 2.5×3.5cm at 200 DPI', () => {
    const nsdl = getIdCardPreset('pan-nsdl')!;
    expect(nsdl.photo.width).toBe(197); // 2.5cm
    expect(nsdl.photo.height).toBe(276); // 3.5cm
    expect(nsdl.photo.width).toBeLessThan(nsdl.photo.height);
  });

  it('UTIITSL PAN photo is square — a different crop from NSDL', () => {
    const utiitsl = getIdCardPreset('pan-utiitsl')!;
    expect(utiitsl.photo.width).toBe(213);
    expect(utiitsl.photo.height).toBe(213);
  });

  it('both PAN presets require a signature (4.5×2cm, landscape) with the same dimensions', () => {
    for (const id of ['pan-nsdl', 'pan-utiitsl']) {
      const sig = getIdCardPreset(id)!.signature!;
      expect(sig.width).toBe(354); // 4.5cm
      expect(sig.height).toBe(157); // 2cm
      expect(sig.width).toBeGreaterThan(sig.height);
    }
  });

  it('non-PAN presets have no signature requirement', () => {
    expect(getIdCardPreset('aadhaar-photo')!.signature).toBeUndefined();
    expect(getIdCardPreset('ayushman-bharat')!.signature).toBeUndefined();
  });

  it('Aadhaar and Ayushman Bharat reuse India\'s standard 35×45mm ID-photo size', () => {
    const india = PASSPORT_PRESETS.find((p) => p.id === 'india')!;
    for (const id of ['aadhaar-photo', 'ayushman-bharat']) {
      const photo = getIdCardPreset(id)!.photo;
      expect(photo.width).toBe(india.width);
      expect(photo.height).toBe(india.height);
      expect(photo.dpi).toBe(india.dpi);
    }
  });
});
