import type { ChemicalElement } from './elements'

export type DiscoveryYear = number

/**
 * Jeden normalizovaný rok na prvek pro školní časovou osu.
 *
 * Seed: sweaver2112/periodic-table-data-complete (`pTable.json` -> `discovered.year`),
 * křížově kontrolováno proti Royal Society of Chemistry a IUPAC u novějších
 * syntetických prvků. Záporné hodnoty značí roky př. n. l.
 */
export const ELEMENT_DISCOVERY_YEAR: Record<number, DiscoveryYear> = {
  1: 1766,
  2: 1895,
  3: 1817,
  4: 1797,
  5: 1808,
  6: -3750,
  7: 1772,
  8: 1774,
  9: 1886,
  10: 1898,
  11: 1807,
  12: 1755,
  13: 1825,
  14: 1824,
  15: 1669,
  16: -500,
  17: 1774,
  18: 1894,
  19: 1807,
  20: 1808,
  21: 1879,
  22: 1791,
  23: 1801,
  24: 1797,
  25: 1774,
  26: -2000,
  27: 1735,
  28: 1751,
  29: -8000,
  30: 1500,
  31: 1875,
  32: 1886,
  33: 1250,
  34: 1817,
  35: 1826,
  36: 1898,
  37: 1861,
  38: 1790,
  39: 1794,
  40: 1789,
  41: 1801,
  42: 1781,
  43: 1937,
  44: 1844,
  45: 1803,
  46: 1803,
  47: -5000,
  48: 1817,
  49: 1863,
  50: -3500,
  51: -3000,
  52: 1783,
  53: 1811,
  54: 1898,
  55: 1860,
  56: 1808,
  57: 1839,
  58: 1803,
  59: 1885,
  60: 1885,
  61: 1945,
  62: 1879,
  63: 1901,
  64: 1880,
  65: 1843,
  66: 1886,
  67: 1878,
  68: 1842,
  69: 1879,
  70: 1878,
  71: 1907,
  72: 1923,
  73: 1802,
  74: 1783,
  75: 1925,
  76: 1803,
  77: 1803,
  78: 1735,
  79: -2500,
  80: -2000,
  81: 1861,
  82: -4000,
  83: 1400,
  84: 1898,
  85: 1940,
  86: 1900,
  87: 1939,
  88: 1898,
  89: 1899,
  90: 1829,
  91: 1913,
  92: 1789,
  93: 1940,
  94: 1940,
  95: 1944,
  96: 1944,
  97: 1949,
  98: 1950,
  99: 1952,
  100: 1952,
  101: 1955,
  102: 1958,
  103: 1961,
  104: 1964,
  105: 1967,
  106: 1974,
  107: 1981,
  108: 1984,
  109: 1982,
  110: 1994,
  111: 1994,
  112: 1996,
  113: 2004,
  114: 1998,
  115: 2004,
  116: 2000,
  117: 2010,
  118: 2006,
}

const YEAR_FMT = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

export function discoveryYearForZ(z: number): DiscoveryYear | null {
  return ELEMENT_DISCOVERY_YEAR[z] ?? null
}

export function discoveryYearForElement(
  element: Pick<ChemicalElement, 'z'>,
): DiscoveryYear | null {
  return discoveryYearForZ(element.z)
}

export function formatDiscoveryYearCs(year: number): string {
  const whole = Math.trunc(year)
  if (whole < 0) return `${YEAR_FMT.format(Math.abs(whole))} př. n. l.`
  return YEAR_FMT.format(whole)
}
