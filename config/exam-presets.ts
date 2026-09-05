/**
 * Exam photo/signature presets — one JSON-shaped config, so specs can be
 * updated without touching any component code.
 *
 * IMPORTANT: the four presets below are PLACEHOLDERS with illustrative,
 * round numbers. They are deliberately named "Example — …" rather than any
 * real exam, and are NOT sourced from a real notification. Per instruction,
 * real verified specs are supplied separately — this file's job is only to
 * prove out the preset system (schema, picker, crop, validation, ZIP) end
 * to end. Every preset still carries the mandatory verification notice
 * fields so the UI's "confirm against the official notification" banner
 * has something real to render even for placeholders.
 */

export interface ExamFileSpec {
  width: number;
  height: number;
  dpi: number;
  minKB: number;
  maxKB: number;
  format: 'jpg';
  background: 'white' | 'light-blue' | 'any';
}

export interface ExamPreset {
  id: string;
  name: string;
  category: string;
  /** Always true here — flips to false once a preset is replaced with a verified one. */
  placeholder: boolean;
  sourceNotification: string;
  verifiedOn: string;
  officialUrl: string;
  photo: ExamFileSpec;
  signature: ExamFileSpec;
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'example-banking-po',
    name: 'Example — Banking PO (sample spec)',
    category: 'Banking (example)',
    placeholder: true,
    sourceNotification: 'Placeholder — not sourced from a real notification',
    verifiedOn: '2026-08-28',
    officialUrl: '',
    photo: { width: 200, height: 230, dpi: 200, minKB: 20, maxKB: 50, format: 'jpg', background: 'white' },
    signature: { width: 140, height: 60, dpi: 200, minKB: 10, maxKB: 20, format: 'jpg', background: 'white' },
  },
  {
    id: 'example-ssc-staff-selection',
    name: 'Example — Staff Selection type exam (sample spec)',
    category: 'Government (example)',
    placeholder: true,
    sourceNotification: 'Placeholder — not sourced from a real notification',
    verifiedOn: '2026-08-28',
    officialUrl: '',
    photo: { width: 213, height: 213, dpi: 200, minKB: 20, maxKB: 50, format: 'jpg', background: 'white' },
    signature: { width: 140, height: 60, dpi: 200, minKB: 10, maxKB: 20, format: 'jpg', background: 'white' },
  },
  {
    id: 'example-university-admission',
    name: 'Example — University admission form (sample spec)',
    category: 'Education (example)',
    placeholder: true,
    sourceNotification: 'Placeholder — not sourced from a real notification',
    verifiedOn: '2026-08-28',
    officialUrl: '',
    photo: { width: 150, height: 200, dpi: 200, minKB: 15, maxKB: 40, format: 'jpg', background: 'white' },
    signature: { width: 120, height: 60, dpi: 200, minKB: 5, maxKB: 15, format: 'jpg', background: 'white' },
  },
  {
    id: 'example-railway-recruitment',
    name: 'Example — Railway recruitment type exam (sample spec)',
    category: 'Government (example)',
    placeholder: true,
    sourceNotification: 'Placeholder — not sourced from a real notification',
    verifiedOn: '2026-08-28',
    officialUrl: '',
    photo: { width: 240, height: 320, dpi: 200, minKB: 20, maxKB: 70, format: 'jpg', background: 'white' },
    signature: { width: 160, height: 80, dpi: 200, minKB: 10, maxKB: 25, format: 'jpg', background: 'white' },
  },
];

export function getExamPreset(id: string): ExamPreset | undefined {
  return EXAM_PRESETS.find((p) => p.id === id);
}

export const EXAM_CATEGORIES: string[] = [...new Set(EXAM_PRESETS.map((p) => p.category))];
