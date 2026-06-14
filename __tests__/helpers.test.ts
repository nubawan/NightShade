import {
  pctStr,
  opacityToPercent,
  getBrightnessMode,
  getBrightnessLabel,
  opacityToLabel,
  hexToRgb,
  rgbToHex,
  clamp,
  formatDate,
  colorLabel,
} from '../src/utils/helpers';

// ─── pctStr ──────────────────────────────────────────────────────
describe('pctStr', () => {
  it('converts 1.0 to "100%"', () => {
    expect(pctStr(1.0)).toBe('100%');
  });

  it('converts 0.5 to "50%"', () => {
    expect(pctStr(0.5)).toBe('50%');
  });

  it('converts 2.0 to "200%"', () => {
    expect(pctStr(2.0)).toBe('200%');
  });

  it('rounds fractional results', () => {
    expect(pctStr(0.333)).toBe('33%');
  });

  it('converts 0 to "0%"', () => {
    expect(pctStr(0)).toBe('0%');
  });
});

// ─── opacityToPercent ────────────────────────────────────────────
describe('opacityToPercent', () => {
  it('converts 1.0 to 100', () => {
    expect(opacityToPercent(1.0)).toBe(100);
  });

  it('converts 0.5 to 50', () => {
    expect(opacityToPercent(0.5)).toBe(50);
  });

  it('rounds fractional values', () => {
    expect(opacityToPercent(0.155)).toBe(16);
  });
});

// ─── getBrightnessMode ──────────────────────────────────────────
describe('getBrightnessMode', () => {
  it('returns "normal" for zero', () => {
    expect(getBrightnessMode(0)).toBe('normal');
  });

  it('returns "normal" for low opacity (0.5)', () => {
    expect(getBrightnessMode(0.5)).toBe('normal');
  });

  it('returns "strong" for opacity at 1.0 boundary', () => {
    expect(getBrightnessMode(1.0)).toBe('strong');
  });

  it('returns "ultra" for 1.3', () => {
    expect(getBrightnessMode(1.3)).toBe('ultra');
  });

  it('returns "amoled" for values above 1.5', () => {
    expect(getBrightnessMode(1.8)).toBe('amoled');
  });
});

// ─── getBrightnessLabel ─────────────────────────────────────────
describe('getBrightnessLabel', () => {
  it('returns "Off" for 0', () => {
    expect(getBrightnessLabel(0)).toBe('Off');
  });

  it('returns "Subtle" for very low opacity', () => {
    expect(getBrightnessLabel(0.10)).toBe('Subtle');
  });

  it('returns "Maximum" for 1.0', () => {
    expect(getBrightnessLabel(1.0)).toBe('Maximum');
  });

  it('returns "AMOLED Dark" for high opacity', () => {
    expect(getBrightnessLabel(2.0)).toBe('AMOLED Dark');
  });
});

// ─── opacityToLabel ─────────────────────────────────────────────
describe('opacityToLabel', () => {
  it('returns "Off" for 0', () => {
    expect(opacityToLabel(0)).toBe('Off');
  });

  it('returns "Subtle Tint" for 0.05', () => {
    expect(opacityToLabel(0.05)).toBe('Subtle Tint');
  });

  it('returns "Maximum Dim" for 1.0', () => {
    expect(opacityToLabel(1.0)).toBe('Maximum Dim');
  });

  it('returns "Extreme Dim" for very high values', () => {
    expect(opacityToLabel(2.0)).toBe('Extreme Dim');
  });
});

// ─── hexToRgb ───────────────────────────────────────────────────
describe('hexToRgb', () => {
  it('parses #FF0000 to red', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses #00FF00 to green', () => {
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses #0000FF to blue', () => {
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses shorthand #F00', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
  });
});

// ─── rgbToHex ───────────────────────────────────────────────────
describe('rgbToHex', () => {
  it('converts pure red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('converts pure green', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
  });

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('clamps values above 255', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
  });
});

// ─── clamp ──────────────────────────────────────────────────────
describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

// ─── formatDate ─────────────────────────────────────────────────
describe('formatDate', () => {
  it('returns "Never" for null', () => {
    expect(formatDate(null)).toBe('Never');
  });

  it('returns "Never" for 0', () => {
    expect(formatDate(0)).toBe('Never');
  });

  it('returns a formatted date string for a valid timestamp', () => {
    const ts = new Date(2025, 0, 15).getTime(); // Jan 15, 2025
    const result = formatDate(ts);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

// ─── colorLabel ─────────────────────────────────────────────────
describe('colorLabel', () => {
  it('returns "Black" for #000000', () => {
    expect(colorLabel('#000000')).toBe('Black');
  });

  it('returns "Custom" for unknown colors', () => {
    expect(colorLabel('#ABCDEF')).toBe('Custom');
  });

  it('handles lowercase known colors', () => {
    expect(colorLabel('#000000')).toBe('Black');
  });
});
