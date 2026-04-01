import type { ChemicalElement, ElementCategory } from './elements'

/** Barvy Bohrova modelu — odpovídají paletě dlaždic (PeriodicTable.css), bez gradientů. */
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

/** ~ color-mix(in srgb, #fbee7b 70%, white 30%) */
const KOV_FACE = '#fcf3a3'
const KOV_RIM_TOP = '#f6af34'
const KOV_SKY = '#c9b358'

const NEKOV_FACE = '#5e9fff'
const NEKOV_RIM_TOP = '#8ec6ff'
const NEKOV_RIM_BOT = '#244f9a'

function isCnopsNonmetal(z: number, cat: ElementCategory): boolean {
  return cat === 'nonmetal' && [6, 7, 8, 15, 16].includes(z)
}

function isCol2CaSrBaRa(z: number, col: number): boolean {
  return col === 2 && [20, 38, 56, 88].includes(z)
}

/**
 * Paleta pro Atom2D — sladěná s odstíny dlaždic / legendy v PeriodicTable.css.
 */
export function atomModelPaletteForElement(el: ChemicalElement): AtomModelPalette {
  const { z, category, col } = el

  const neut = {
    neutronFill: '#b0bec5',
    neutronStroke: '#546e7a',
  } as const

  if (z === 85) {
    return {
      nucleusFill: '#f03b50',
      nucleusStroke: '#ffffff',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#ffffff',
      electronStroke: '#fce4ec',
      orbitStroke: '#f48fb1',
    }
  }

  if (isCol2CaSrBaRa(z, col)) {
    return {
      nucleusFill: '#f03b50',
      nucleusStroke: '#ffcdd2',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#ffcdd2',
      electronStroke: '#c62828',
      orbitStroke: '#e57373',
    }
  }

  if (isCnopsNonmetal(z, category)) {
    return {
      nucleusFill: '#126cb0',
      nucleusStroke: '#42a5f5',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#8ec6ff',
      electronStroke: '#1976d2',
      orbitStroke: '#5e9fff',
    }
  }

  if (category === 'metalloid') {
    return {
      nucleusFill: '#f8485e',
      nucleusStroke: '#ff6f82',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#ff8a9a',
      electronStroke: '#c62828',
      orbitStroke: '#e57373',
    }
  }

  if (category === 'noble-gas') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: '#ffcf6a',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#ffcf6a',
      electronStroke: '#ffa726',
      orbitStroke: '#ffb74d',
    }
  }

  if (category === 'halogen') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: '#ffffff',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#e3f2fd',
      electronStroke: NEKOV_RIM_BOT,
      orbitStroke: '#42a5f5',
    }
  }

  if (category === 'nonmetal') {
    return {
      nucleusFill: NEKOV_FACE,
      nucleusStroke: NEKOV_RIM_TOP,
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: NEKOV_RIM_TOP,
      electronStroke: NEKOV_RIM_BOT,
      orbitStroke: '#42a5f5',
    }
  }

  if (category === 'lanthanide') {
    return {
      nucleusFill: '#0d8d5e',
      nucleusStroke: '#5fffbe',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#5fffbe',
      electronStroke: '#0a5c40',
      orbitStroke: '#4db6ac',
    }
  }

  if (category === 'actinide') {
    return {
      nucleusFill: '#a855e8',
      nucleusStroke: '#dd80ff',
      protonFill: '#ff1744',
      protonStroke: '#b71c1c',
      ...neut,
      electronFill: '#dd80ff',
      electronStroke: '#7b1fa2',
      orbitStroke: '#ce93d8',
    }
  }

  /* Kovy: alkali, alkaline-earth, transition, post-transition — žlutá tvář jako .pt-fill-kov */
  return {
    nucleusFill: KOV_FACE,
    nucleusStroke: KOV_RIM_TOP,
    protonFill: '#ff1744',
    protonStroke: '#b71c1c',
    ...neut,
    electronFill: KOV_RIM_TOP,
    electronStroke: '#d4a017',
    orbitStroke: KOV_SKY,
  }
}
