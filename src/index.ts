#!/usr/bin/env node

/**
 * ColorCraft CLI entry point.
 * Parses arguments and dispatches commands.
 */

import { isValidHex } from './color';
import { generatePalette, generateAllPalettes, generateRandom, PALETTE_TYPES, PaletteType } from './palette';
import { checkContrast } from './contrast';
import {
  formatPalette,
  formatAllPalettes,
  formatConversion,
  formatContrast,
  formatRandomColors,
  paletteToJson,
  colorsToJson,
  contrastToJson,
  conversionToJson,
  paletteToCss,
  colorsToCss,
} from './formatter';
import { startServer } from './server';

function parseArgs(argv: string[]): { command: string; args: string[]; flags: Record<string, string | boolean> } {
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(arg);
    }
  }

  const command = args[0] || '';
  return { command, args: args.slice(1), flags };
}

function printUsage(): void {
  console.log(`
  \x1b[1mColorCraft\x1b[0m — Color Palette Generator

  \x1b[1mUsage:\x1b[0m
    colorcraft <hex>                        Generate all palettes
    colorcraft <hex> --type <type>          Specific palette type
    colorcraft convert <hex>                Show HEX/RGB/HSL
    colorcraft random [--count N]           Random palette
    colorcraft contrast <hex1> <hex2>       WCAG contrast check
    colorcraft --serve [--port N]           Start web UI

  \x1b[1mPalette types:\x1b[0m
    complementary, analogous, triadic, tetradic,
    split-complementary, monochromatic

  \x1b[1mFlags:\x1b[0m
    --json    Output as JSON
    --css     Output as CSS variables
    --serve   Start web interface (default port: 3458)
    --port    Custom port for web server

  \x1b[1mExamples:\x1b[0m
    colorcraft "#ff6b35"
    colorcraft "#3498db" --type triadic
    colorcraft convert "#ff6b35"
    colorcraft random --count 8
    colorcraft contrast "#000000" "#ffffff"
    colorcraft "#ff6b35" --css
    colorcraft --serve --port 8080
`);
}

function normalizeHexArg(hex: string): string {
  if (!hex.startsWith('#')) hex = '#' + hex;
  return hex.toLowerCase();
}

function main(): void {
  const raw = process.argv.slice(2);

  if (raw.length === 0) {
    printUsage();
    process.exit(0);
  }

  const { command, args, flags } = parseArgs(raw);
  const isJson = flags['json'] === true;
  const isCss = flags['css'] === true;

  // --serve flag (can appear anywhere)
  if (flags['serve'] === true) {
    const port = typeof flags['port'] === 'string' ? parseInt(flags['port'], 10) : 3458;
    startServer(port);
    return;
  }

  // Help
  if (command === 'help' || command === '--help' || command === '-h' || flags['help'] === true) {
    printUsage();
    return;
  }

  // Random command
  if (command === 'random') {
    const count = typeof flags['count'] === 'string' ? parseInt(flags['count'], 10) : 5;
    const colors = generateRandom(count);

    if (isJson) {
      console.log(colorsToJson(colors));
    } else if (isCss) {
      console.log(colorsToCss(colors, 'random'));
    } else {
      console.log(formatRandomColors(colors));
    }
    return;
  }

  // Convert command
  if (command === 'convert') {
    const hex = args[0];
    if (!hex) {
      console.error('  Error: Provide a hex color. Example: colorcraft convert "#ff6b35"');
      process.exit(1);
    }
    const normalized = normalizeHexArg(hex);
    if (!isValidHex(normalized)) {
      console.error(`  Error: Invalid hex color: ${hex}`);
      process.exit(1);
    }

    if (isJson) {
      console.log(conversionToJson(normalized));
    } else {
      console.log(formatConversion(normalized));
    }
    return;
  }

  // Contrast command
  if (command === 'contrast') {
    const hex1 = args[0];
    const hex2 = args[1];
    if (!hex1 || !hex2) {
      console.error('  Error: Provide two hex colors. Example: colorcraft contrast "#000000" "#ffffff"');
      process.exit(1);
    }
    const n1 = normalizeHexArg(hex1);
    const n2 = normalizeHexArg(hex2);
    if (!isValidHex(n1) || !isValidHex(n2)) {
      console.error('  Error: Invalid hex color(s).');
      process.exit(1);
    }

    const result = checkContrast(n1, n2);
    if (isJson) {
      console.log(contrastToJson(result));
    } else {
      console.log(formatContrast(result));
    }
    return;
  }

  // Default: palette generation from a hex color
  if (!isValidHex(command)) {
    console.error(`  Error: "${command}" is not a valid hex color or command.`);
    console.error('  Run "colorcraft help" for usage.');
    process.exit(1);
  }

  const hex = normalizeHexArg(command);
  const typeFlag = flags['type'] as string | undefined;

  if (typeFlag) {
    if (!PALETTE_TYPES.includes(typeFlag as PaletteType)) {
      console.error(`  Error: Invalid palette type "${typeFlag}".`);
      console.error(`  Valid types: ${PALETTE_TYPES.join(', ')}`);
      process.exit(1);
    }

    const palette = generatePalette(hex, typeFlag as PaletteType);
    if (isJson) {
      console.log(paletteToJson([palette]));
    } else if (isCss) {
      console.log(paletteToCss([palette]));
    } else {
      console.log(formatPalette(palette) + '\n');
    }
  } else {
    const palettes = generateAllPalettes(hex);
    if (isJson) {
      console.log(paletteToJson(palettes));
    } else if (isCss) {
      console.log(paletteToCss(palettes));
    } else {
      console.log(formatAllPalettes(palettes));
    }
  }
}

main();
