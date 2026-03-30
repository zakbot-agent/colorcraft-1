/**
 * CLI output formatter.
 * ANSI color swatches, structured text output, JSON/CSS modes.
 */

import { RGB, HSL, hexToRgb, rgbToHsl, formatRgb, formatHsl } from './color';
import { PaletteResult } from './palette';
import { ContrastResult } from './contrast';

// ─── ANSI helpers ───

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function bgRgb(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

function fgRgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

/** Render a color swatch block in the terminal. */
function swatch(hex: string, width: number = 7): string {
  const rgb = hexToRgb(hex);
  const block = '\u2588'.repeat(width);
  return `${fgRgb(rgb.r, rgb.g, rgb.b)}${block}${RESET}`;
}

/** Render a color swatch with background. */
function swatchBg(hex: string, width: number = 5): string {
  const rgb = hexToRgb(hex);
  return `${bgRgb(rgb.r, rgb.g, rgb.b)}${' '.repeat(width)}${RESET}`;
}

/** Format a color line: swatch + hex + rgb + hsl. */
function colorLine(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return `  ${swatch(hex)} ${swatchBg(hex)}  ${BOLD}${hex}${RESET}  ${DIM}${formatRgb(rgb)}  ${formatHsl(hsl)}${RESET}`;
}

// ─── Public formatters ───

export function formatPalette(palette: PaletteResult): string {
  const title = palette.type.charAt(0).toUpperCase() + palette.type.slice(1);
  const lines = [
    '',
    `${BOLD}  ${title}${RESET} ${DIM}(base: ${palette.base})${RESET}`,
    `  ${'─'.repeat(60)}`,
  ];

  for (const color of palette.colors) {
    lines.push(colorLine(color));
  }

  return lines.join('\n');
}

export function formatAllPalettes(palettes: PaletteResult[]): string {
  const header = `\n${BOLD}  ColorCraft${RESET} ${DIM}— Color Palette Generator${RESET}\n`;
  return header + palettes.map(formatPalette).join('\n') + '\n';
}

export function formatConversion(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  return [
    '',
    `${BOLD}  Color Conversion${RESET}`,
    `  ${'─'.repeat(40)}`,
    `  ${swatch(hex, 10)} ${swatchBg(hex, 8)}`,
    '',
    `  ${BOLD}HEX${RESET}  ${hex}`,
    `  ${BOLD}RGB${RESET}  ${formatRgb(rgb)}`,
    `  ${BOLD}HSL${RESET}  ${formatHsl(hsl)}`,
    `  ${BOLD}R${RESET} ${rgb.r}  ${BOLD}G${RESET} ${rgb.g}  ${BOLD}B${RESET} ${rgb.b}`,
    `  ${BOLD}H${RESET} ${hsl.h}°  ${BOLD}S${RESET} ${hsl.s}%  ${BOLD}L${RESET} ${hsl.l}%`,
    '',
  ].join('\n');
}

export function formatContrast(result: ContrastResult): string {
  const pass = (v: boolean) => (v ? `\x1b[32m PASS ${RESET}` : `\x1b[31m FAIL ${RESET}`);

  return [
    '',
    `${BOLD}  Contrast Check${RESET}`,
    `  ${'─'.repeat(40)}`,
    `  ${swatch(result.color1)} ${result.color1}  vs  ${swatch(result.color2)} ${result.color2}`,
    '',
    `  ${BOLD}Ratio${RESET}  ${result.ratioText}`,
    '',
    `  ${BOLD}WCAG AA${RESET}   Normal text: ${pass(result.aa.normalText)}  Large text: ${pass(result.aa.largeText)}`,
    `  ${BOLD}WCAG AAA${RESET}  Normal text: ${pass(result.aaa.normalText)}  Large text: ${pass(result.aaa.largeText)}`,
    '',
  ].join('\n');
}

export function formatRandomColors(colors: string[]): string {
  const lines = [
    '',
    `${BOLD}  Random Palette${RESET} ${DIM}(${colors.length} colors)${RESET}`,
    `  ${'─'.repeat(60)}`,
  ];

  for (const color of colors) {
    lines.push(colorLine(color));
  }

  lines.push('');
  return lines.join('\n');
}

// ─── JSON output ───

export function paletteToJson(palettes: PaletteResult[]): string {
  const data = palettes.map((p) => ({
    type: p.type,
    base: p.base,
    colors: p.colors.map((hex) => {
      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);
      return { hex, rgb: formatRgb(rgb), hsl: formatHsl(hsl) };
    }),
  }));
  return JSON.stringify(data, null, 2);
}

export function colorsToJson(colors: string[]): string {
  const data = colors.map((hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    return { hex, rgb: formatRgb(rgb), hsl: formatHsl(hsl) };
  });
  return JSON.stringify(data, null, 2);
}

export function contrastToJson(result: ContrastResult): string {
  return JSON.stringify(result, null, 2);
}

export function conversionToJson(hex: string): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  return JSON.stringify({ hex, rgb: formatRgb(rgb), hsl: formatHsl(hsl), r: rgb.r, g: rgb.g, b: rgb.b, h: hsl.h, s: hsl.s, l: hsl.l }, null, 2);
}

// ─── CSS output ───

export function paletteToCss(palettes: PaletteResult[]): string {
  const lines = [':root {'];

  for (const palette of palettes) {
    lines.push(`  /* ${palette.type} */`);
    palette.colors.forEach((hex, i) => {
      const rgb = hexToRgb(hex);
      const name = `--${palette.type}-${i + 1}`;
      lines.push(`  ${name}: ${hex};`);
      lines.push(`  ${name}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};`);
    });
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n');
}

export function colorsToCss(colors: string[], prefix: string = 'color'): string {
  const lines = [':root {'];

  colors.forEach((hex, i) => {
    const rgb = hexToRgb(hex);
    lines.push(`  --${prefix}-${i + 1}: ${hex};`);
    lines.push(`  --${prefix}-${i + 1}-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};`);
  });

  lines.push('}');
  return lines.join('\n');
}
