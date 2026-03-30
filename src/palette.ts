/**
 * Palette generation algorithms.
 * All based on HSL color wheel manipulation.
 */

import { HSL, hexToHsl, hslToHex, wrapHue, clamp } from './color';

export type PaletteType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic'
  | 'split-complementary';

export interface PaletteResult {
  type: PaletteType;
  base: string;
  colors: string[];
}

/** Generate a palette of the given type from a base hex color. */
export function generatePalette(baseHex: string, type: PaletteType): PaletteResult {
  const hsl = hexToHsl(baseHex);
  const generators: Record<PaletteType, (h: HSL) => string[]> = {
    complementary: genComplementary,
    analogous: genAnalogous,
    triadic: genTriadic,
    tetradic: genTetradic,
    monochromatic: genMonochromatic,
    'split-complementary': genSplitComplementary,
  };

  return {
    type,
    base: baseHex.startsWith('#') ? baseHex.toLowerCase() : `#${baseHex.toLowerCase()}`,
    colors: generators[type](hsl),
  };
}

/** Generate all palette types from a base color. */
export function generateAllPalettes(baseHex: string): PaletteResult[] {
  const types: PaletteType[] = [
    'complementary',
    'analogous',
    'triadic',
    'tetradic',
    'split-complementary',
    'monochromatic',
  ];
  return types.map((t) => generatePalette(baseHex, t));
}

function shiftHue(hsl: HSL, degrees: number): string {
  return hslToHex({ h: wrapHue(hsl.h + degrees), s: hsl.s, l: hsl.l });
}

function genComplementary(hsl: HSL): string[] {
  return [hslToHex(hsl), shiftHue(hsl, 180)];
}

function genAnalogous(hsl: HSL): string[] {
  return [shiftHue(hsl, -30), hslToHex(hsl), shiftHue(hsl, 30)];
}

function genTriadic(hsl: HSL): string[] {
  return [hslToHex(hsl), shiftHue(hsl, 120), shiftHue(hsl, 240)];
}

function genTetradic(hsl: HSL): string[] {
  return [hslToHex(hsl), shiftHue(hsl, 90), shiftHue(hsl, 180), shiftHue(hsl, 270)];
}

function genSplitComplementary(hsl: HSL): string[] {
  return [hslToHex(hsl), shiftHue(hsl, 150), shiftHue(hsl, 210)];
}

function genMonochromatic(hsl: HSL): string[] {
  const lightnesses = [20, 35, 50, 65, 80];
  return lightnesses.map((l) => hslToHex({ h: hsl.h, s: hsl.s, l: clamp(l, 0, 100) }));
}

/** Generate random aesthetically pleasing colors. */
export function generateRandom(count: number = 5): string[] {
  const colors: string[] = [];
  // Golden angle distribution for pleasant hue spread
  const goldenAngle = 137.508;
  const startHue = Math.random() * 360;

  for (let i = 0; i < count; i++) {
    const h = wrapHue(startHue + i * goldenAngle);
    const s = 55 + Math.random() * 30; // 55-85%
    const l = 45 + Math.random() * 20; // 45-65%
    colors.push(hslToHex({ h: Math.round(h * 10) / 10, s: Math.round(s * 10) / 10, l: Math.round(l * 10) / 10 }));
  }

  return colors;
}

export const PALETTE_TYPES: PaletteType[] = [
  'complementary',
  'analogous',
  'triadic',
  'tetradic',
  'split-complementary',
  'monochromatic',
];
