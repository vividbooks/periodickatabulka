import { ELEMENTS } from './elements'
import {
  discoveryYearForZ,
  formatDiscoveryYearCs,
} from './elementDiscoveryYear'
import {
  earthAbundancePercentForZ,
  formatEarthAbundancePercentCs,
} from './elementEarthAbundance'
import type { PropertyExploreKey } from './exploreProperty'
import {
  MELTING_POINT_SLIDER_MAX_C,
  MELTING_POINT_SLIDER_MIN_C,
  meltingPointForZ,
} from './elementMeltingPointC'
import {
  ELEMENT_ATOMIC_RADIUS_PM,
  ELEMENT_BOILING_POINT_C,
  ELEMENT_ELECTRON_AFFINITY_KJ,
  ELEMENT_FIRST_IONIZATION_KJ,
  ELEMENT_SPECIFIC_HEAT_J_PER_GK,
} from './elementExploreScalars.generated'
import { ZS_ELEMENT_CORE } from './zsElementCore'

const PERIODIC_TABLE_DISCOVERY_YEAR = 1869

function parseZsDecimal(s: string | null | undefined): number | null {
  if (s == null || s === '—' || s.trim() === '') return null
  const n = Number.parseFloat(s.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function extentFrom(getter: (z: number) => number | null): {
  min: number
  max: number
} {
  let min = Infinity
  let max = -Infinity
  for (const { z } of ELEMENTS) {
    const v = getter(z)
    if (v != null && Number.isFinite(v)) {
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
  const span = max - min
  const pad = span > 0 ? span * 0.02 : Math.abs(max || 1) * 0.02 || 0.01
  return { min: min - pad, max: max + pad }
}

export function scalarValueForExploreProperty(
  z: number,
  key: PropertyExploreKey,
): number | null {
  switch (key) {
    case 'melting-point':
      return meltingPointForZ(z)
    case 'boiling-point': {
      const v = ELEMENT_BOILING_POINT_C[z]
      return v === undefined ? null : v
    }
    case 'density':
      return parseZsDecimal(ZS_ELEMENT_CORE[z]?.hustota ?? null)
    case 'electronegativity':
      return parseZsDecimal(ZS_ELEMENT_CORE[z]?.elektronegativita ?? null)
    case 'ionization': {
      const v = ELEMENT_FIRST_IONIZATION_KJ[z]
      return v === undefined ? null : v
    }
    case 'electron-affinity': {
      const v = ELEMENT_ELECTRON_AFFINITY_KJ[z]
      return v === undefined ? null : v
    }
    case 'atomic-radius': {
      const v = ELEMENT_ATOMIC_RADIUS_PM[z]
      return v === undefined ? null : v
    }
    case 'specific-heat': {
      const v = ELEMENT_SPECIFIC_HEAT_J_PER_GK[z]
      return v === undefined ? null : v
    }
    case 'discovery-year': {
      const year = discoveryYearForZ(z)
      return year == null ? null : Math.max(PERIODIC_TABLE_DISCOVERY_YEAR, year)
    }
    case 'earth-abundance':
      return earthAbundancePercentForZ(z)
    default:
      return null
  }
}

export type PropertyScaleMeta = {
  min: number
  max: number
  step: number
  label: string
  unit: string
  formatBound: (n: number) => string
  trackGradient?: string
  scalarPalette?: 'rainbow' | 'grayscale'
  selectionMode?: 'range' | 'max-only'
}

const boilingExtent = extentFrom((z) => {
  const v = ELEMENT_BOILING_POINT_C[z]
  return v === undefined ? null : v
})
const ionExtent = extentFrom((z) => {
  const v = ELEMENT_FIRST_IONIZATION_KJ[z]
  return v === undefined ? null : v
})
const eaExtent = extentFrom((z) => {
  const v = ELEMENT_ELECTRON_AFFINITY_KJ[z]
  return v === undefined ? null : v
})
const radiusExtent = extentFrom((z) => {
  const v = ELEMENT_ATOMIC_RADIUS_PM[z]
  return v === undefined ? null : v
})
const cpExtent = extentFrom((z) => {
  const v = ELEMENT_SPECIFIC_HEAT_J_PER_GK[z]
  return v === undefined ? null : v
})
const densityExtent = extentFrom((z) =>
  parseZsDecimal(ZS_ELEMENT_CORE[z]?.hustota ?? null),
)
const chiExtent = extentFrom((z) =>
  parseZsDecimal(ZS_ELEMENT_CORE[z]?.elektronegativita ?? null),
)
const discoveryYears = ELEMENTS.map(({ z }) => discoveryYearForZ(z)).filter(
  (v): v is number => v != null,
)
const discoveryYearExtent = {
  min: PERIODIC_TABLE_DISCOVERY_YEAR,
  max: Math.max(...discoveryYears),
}
const earthAbundanceExtent = {
  min: 0,
  max: Math.max(...ELEMENTS.map(({ z }) => earthAbundancePercentForZ(z) ?? 0)),
}

function fmtIntCs(n: number): string {
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(
    Math.round(n),
  )
}

function fmt2Cs(n: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export const PROPERTY_SCALE: Record<PropertyExploreKey, PropertyScaleMeta> = {
  'melting-point': {
    min: MELTING_POINT_SLIDER_MIN_C,
    max: MELTING_POINT_SLIDER_MAX_C,
    step: 1,
    label: 'Bod tání',
    unit: '°C',
    formatBound: (n) => `${fmtIntCs(n)} °C`,
  },
  'boiling-point': {
    min: boilingExtent.min,
    max: boilingExtent.max,
    step: 1,
    label: 'Bod varu',
    unit: '°C',
    formatBound: (n) => `${fmtIntCs(n)} °C`,
  },
  density: {
    min: densityExtent.min,
    max: densityExtent.max,
    step: 0.001,
    label: 'Hustota',
    unit: 'g/cm³',
    formatBound: (n) => `${fmt2Cs(n)} g/cm³`,
  },
  electronegativity: {
    min: chiExtent.min,
    max: chiExtent.max,
    step: 0.01,
    label: 'Elektronegativita',
    unit: 'χ (Pauling)',
    formatBound: (n) => fmt2Cs(n),
  },
  ionization: {
    min: ionExtent.min,
    max: ionExtent.max,
    step: 1,
    label: '1. ionizační energie',
    unit: 'kJ/mol',
    formatBound: (n) => `${fmtIntCs(n)} kJ/mol`,
  },
  'electron-affinity': {
    min: eaExtent.min,
    max: eaExtent.max,
    step: 1,
    label: 'Elektronová afinita',
    unit: 'kJ/mol',
    formatBound: (n) => `${fmtIntCs(n)} kJ/mol`,
  },
  'atomic-radius': {
    min: radiusExtent.min,
    max: radiusExtent.max,
    step: 1,
    label: 'Atomový poloměr',
    unit: 'pm',
    formatBound: (n) => `${fmtIntCs(n)} pm`,
  },
  'specific-heat': {
    min: cpExtent.min,
    max: cpExtent.max,
    step: 0.01,
    label: 'Měrná tepelná kapacita',
    unit: 'J/(g·°C)',
    formatBound: (n) => `${fmt2Cs(n)} J/(g·°C)`,
  },
  'discovery-year': {
    min: Math.trunc(discoveryYearExtent.min),
    max: Math.trunc(discoveryYearExtent.max),
    step: 1,
    label: 'Časový vývoj',
    unit: 'rok objevu',
    formatBound: (n) => formatDiscoveryYearCs(n),
    trackGradient: 'linear-gradient(90deg, #05070d 0%, #ffffff 100%)',
    scalarPalette: 'grayscale',
    selectionMode: 'max-only',
  },
  'earth-abundance': {
    min: earthAbundanceExtent.min,
    max: earthAbundanceExtent.max,
    step: 0.000001,
    label: 'Zastoupení % na Zemi',
    unit: '% hmotnosti Země',
    formatBound: (n) => formatEarthAbundancePercentCs(n),
    trackGradient:
      'linear-gradient(90deg, hsl(235 72% 34%) 0%, hsl(180 72% 42%) 30%, hsl(90 78% 46%) 62%, hsl(12 82% 49%) 100%)',
    scalarPalette: 'rainbow',
    selectionMode: 'max-only',
  },
}

export function defaultPropertyExploreState(
  key: PropertyExploreKey,
): {
  kind: 'property'
  property: PropertyExploreKey
  rangeMin: number
  rangeMax: number
} {
  const s = PROPERTY_SCALE[key]
  return {
    kind: 'property',
    property: key,
    rangeMin: s.min,
    rangeMax: s.selectionMode === 'max-only' ? s.min : s.max,
  }
}
