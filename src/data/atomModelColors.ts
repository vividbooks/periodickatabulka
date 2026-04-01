import type { ChemicalElement, ElementCategory } from './elements'

/**
 * Barvy Bohrova modelu: z tabulky jen „slupka“ jádra (velký kruh).
 * Elektrony, dráhy a částice v jádře jsou u všech prvků stejné — jinak by to vypadalo,
 * že se mění „druh“ elektronů podle prvku.
 */
export type AtomModelPalette = {
  nucleusFill: string
  nucleusStroke: string
  protonFill: string
  protonStroke: string
  neutronFill: string
  neutronStroke: string
  electronFill: string
  electronStroke: string
  orbitStroke: string
}

/** ~ color-mix(in srgb, #fbee7b 70%, white 30%) — tvář kovů v tabulce */
const KOV_FACE = '#fcf3a3'
const KOV_RIM_TOP = '#f6af34'

const NEKOV_FACE = '#5e9fff'
const NEKOV_RIM_TOP = '#8ec6ff'

/** Jednotné elektrony a oběžné dráhy (dříve modrý gradient → plochá výplň). */
const ELECTRON_FILL = '#8ec6ff'
const ELECTRON_STROKE = '#1565c0'
const ORBIT_STROKE = '#64748b'

const PROTON_FILL = '#ff1744'
const PROTON_STROKE = '#b71c1c'
const NEUTRON_FILL = '#b0bec5'
const NEUTRON_STROKE = '#546e7a'

function isCnopsNonmetal(z: number, cat: ElementCategory): boolean {
  return cat === 'nonmetal' && [6, 7, 8, 15, 16].includes(z)
}

function isCol2CaSrBaRa(z: number, col: number): boolean {
  return col === 2 && [20, 38, 56, 88].includes(z)
}

function sameParticlesEverywhere(): Pick<
  AtomModelPalette,
  | 'protonFill'
  | 'protonStroke'
  | 'neutronFill'
  | 'neutronStroke'
  | 'electronFill'
  | 'electronStroke'
  | 'orbitStroke'
> {
  return {
    protonFill: PROTON_FILL,
    protonStroke: PROTON_STROKE,
    neutronFill: NEUTRON_FILL,
    neutronStroke: NEUTRON_STROKE,
    electronFill: ELECTRON_FILL,
    electronStroke: ELECTRON_STROKE,
    orbitStroke: ORBIT_STROKE,
  }
}

/**
 * Paleta jádra podle dlaždice prvku (PeriodicTable.css); zbytek modelu je všude stejný.
 */
export function atomModelPaletteForElement(el: ChemicalElement): AtomModelPalette {
  const { z, category, col } = el

  if (z === 85) {
    return {
      nucleusFill: '#f03b50',
      nucleusStroke: '#ffffff',
      ...sameParticlesEverywhere(),
    }
  }

  if (isCol2CaSrBaRa(z, col)) {
    return {
      nucleusFill: '#f03b50',
      nucleusStroke: '#ffcdd2',
      ...sameParticlesEverywhere(),
    }
  }

  if (isCnopsNonmetal(z, category)) {
    return {
      nucleusFill: '#126cb0',
      nucleusStroke: '#42a5f5',
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'metalloid') {
    return {
      nucleusFill: '#f8485e',
      nucleusStroke: '#ff6f82',
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'noble-gas') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: '#ffcf6a',
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'halogen') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: '#ffffff',
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'nonmetal') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: NEKOV_RIM_TOP,
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'lanthanide') {
    return {
      nucleusFill: '#0d8d5e',
      nucleusStroke: '#5fffbe',
      ...sameParticlesEverywhere(),
    }
  }

  if (category === 'actinide') {
    return {
      nucleusFill: '#a855e8',
      nucleusStroke: '#dd80ff',
      ...sameParticlesEverywhere(),
    }
  }

  return {
    nucleusFill: KOV_FACE,
    nucleusStroke: KOV_RIM_TOP,
    ...sameParticlesEverywhere(),
  }
}
