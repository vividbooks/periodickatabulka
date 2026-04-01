import type { ElementCategory } from './elements'

/** Klíč tlačítka ve spodní legendě (odpovídá pedagogickému členění). */
export type LegendCategoryKey =
  | 'kovy'
  | 'polokovy'
  | 'nekovy'
  | 'alkali'
  | 'alkaline'
  | 'halogen'
  | 'noble'
  | 'lanthanide'
  | 'actinide'

export const LEGEND_BUTTONS: readonly {
  id: LegendCategoryKey
  label: string
  style: LegendCategoryKey
}[] = [
  { id: 'kovy', label: 'Kovy', style: 'kovy' },
  { id: 'polokovy', label: 'Polokovy', style: 'polokovy' },
  { id: 'nekovy', label: 'Nekovy', style: 'nekovy' },
  { id: 'alkali', label: 'Alkalické kovy', style: 'alkali' },
  { id: 'alkaline', label: 'Kovy alkalických zemin', style: 'alkaline' },
  { id: 'halogen', label: 'Halogeny', style: 'halogen' },
  { id: 'noble', label: 'Vzácné plyny', style: 'noble' },
  { id: 'lanthanide', label: 'Lanthanoidy', style: 'lanthanide' },
  { id: 'actinide', label: 'Aktinoidy', style: 'actinide' },
] as const

export function elementMatchesLegend(
  category: ElementCategory,
  key: LegendCategoryKey,
): boolean {
  switch (key) {
    case 'kovy':
      return category === 'transition' || category === 'post-transition'
    case 'polokovy':
      return category === 'metalloid'
    case 'nekovy':
      return category === 'nonmetal'
    case 'alkali':
      return category === 'alkali-metal'
    case 'alkaline':
      return category === 'alkaline-earth'
    case 'halogen':
      return category === 'halogen'
    case 'noble':
      return category === 'noble-gas'
    case 'lanthanide':
      return category === 'lanthanide'
    case 'actinide':
      return category === 'actinide'
    default:
      return false
  }
}
