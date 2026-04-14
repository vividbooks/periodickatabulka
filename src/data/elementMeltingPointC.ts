/**
 * Bod tání při normálním tlaku (°C), kde je ve zdrojích rozumně udáno.
 * Zdroj: převážně Wikipedia / CRC; u He při 1 atm pevná fáze prakticky ne — null.
 * Transaktinidy 104+ často bez spolehlivého údaje → null.
 */

export const MELTING_POINT_SLIDER_MIN_C = -273
export const MELTING_POINT_SLIDER_MAX_C = 3900

/** Atomové číslo → bod tání (°C) nebo null = bez údaje / N/A. */
export const ELEMENT_MELTING_POINT_C: Record<number, number | null> = {
  1: -259.16,
  2: null,
  3: 180.5,
  4: 1287,
  5: 2076,
  6: 3550,
  7: -210.0,
  8: -218.79,
  9: -219.62,
  10: -248.59,
  11: 97.794,
  12: 650,
  13: 660.32,
  14: 1414,
  15: 44.15,
  16: 115.21,
  17: -101.5,
  18: -189.34,
  19: 63.5,
  20: 842,
  21: 1541,
  22: 1668,
  23: 1910,
  24: 1907,
  25: 1246,
  26: 1538,
  27: 1495,
  28: 1455,
  29: 1084.62,
  30: 419.53,
  31: 29.7646,
  32: 938.25,
  33: 817,
  34: 221,
  35: -7.2,
  36: -157.37,
  37: 39.3,
  38: 777,
  39: 1522,
  40: 1855,
  41: 2477,
  42: 2623,
  43: 2157,
  44: 2334,
  45: 1964,
  46: 1554.9,
  47: 961.78,
  48: 321.07,
  49: 156.6,
  50: 231.93,
  51: 630.63,
  52: 449.51,
  53: 113.7,
  54: -111.75,
  55: 28.44,
  56: 727,
  57: 920,
  58: 795,
  59: 931,
  60: 1016,
  61: 1042,
  62: 1072,
  63: 822,
  64: 1312,
  65: 1356,
  66: 1407,
  67: 1474,
  68: 1529,
  69: 1545,
  70: 824,
  71: 1663,
  72: 2233,
  73: 3017,
  74: 3422,
  75: 3186,
  76: 3033,
  77: 2446,
  78: 1768.3,
  79: 1064.18,
  80: -38.829,
  81: 304,
  82: 327.46,
  83: 271.4,
  84: 254,
  85: 302,
  86: -71,
  87: 27,
  88: 700,
  89: 1050,
  90: 1750,
  91: 1572,
  92: 1132,
  93: 644,
  94: 640,
  95: 1176,
  96: 1345,
  97: 986,
  98: 900,
  99: 860,
  100: 1527,
  101: 800,
  102: 827,
  103: 1627,
  104: null,
  105: null,
  106: null,
  107: null,
  108: null,
  109: null,
  110: null,
  111: null,
  112: null,
  113: null,
  114: null,
  115: null,
  116: null,
  117: null,
  118: null,
}

export function meltingPointForZ(z: number): number | null {
  const v = ELEMENT_MELTING_POINT_C[z]
  return v === undefined ? null : v
}

export function tileColorsForMeltingPoint(mp: number | null): {
  face: string
  rimTop: string
  rimBot: string
  ink: string
} {
  if (mp == null || !Number.isFinite(mp)) {
    return {
      face: 'hsl(218 14% 32%)',
      rimTop: 'hsl(218 16% 44%)',
      rimBot: 'hsl(218 18% 20%)',
      ink: '#eef3ff',
    }
  }
  const span = MELTING_POINT_SLIDER_MAX_C - MELTING_POINT_SLIDER_MIN_C
  const t = Math.max(
    0,
    Math.min(1, (mp - MELTING_POINT_SLIDER_MIN_C) / span),
  )
  const h = 235 * (1 - t) + 12 * t
  const s = 72
  const faceL = 34 + t * 15
  const face = `hsl(${h} ${s}% ${faceL}%)`
  const rimTop = `hsl(${h} ${Math.min(88, s + 10)}% ${Math.min(74, faceL + 24)}%)`
  const rimBot = `hsl(${h} ${s + 6}% ${Math.max(15, faceL - 22)}%)`
  const ink = faceL > 50 ? '#0a1020' : '#f8fafc'
  return { face, rimTop, rimBot, ink }
}
