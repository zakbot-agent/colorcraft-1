/**
 * WCAG 2.0 contrast ratio checker.
 * Uses relative luminance formula.
 */

import { RGB, hexToRgb } from './color';

/** Convert sRGB channel to linear. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Calculate relative luminance per WCAG 2.0. */
export function relativeLuminance(rgb: RGB): number {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/** Calculate contrast ratio between two colors. */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  color1: string;
  color2: string;
  ratio: number;
  ratioText: string;
  aa: { normalText: boolean; largeText: boolean };
  aaa: { normalText: boolean; largeText: boolean };
}

/** Full contrast check with WCAG AA and AAA compliance. */
export function checkContrast(hex1: string, hex2: string): ContrastResult {
  const ratio = contrastRatio(hex1, hex2);
  const rounded = Math.round(ratio * 100) / 100;

  return {
    color1: hex1,
    color2: hex2,
    ratio: rounded,
    ratioText: `${rounded.toFixed(2)}:1`,
    aa: {
      normalText: ratio >= 4.5,
      largeText: ratio >= 3,
    },
    aaa: {
      normalText: ratio >= 7,
      largeText: ratio >= 4.5,
    },
  };
}
