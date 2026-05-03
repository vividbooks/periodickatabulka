import type { ElementCategory } from './elements'
import type { LegendCategoryKey } from './legendCategories'
import {
  elementMatchesLegend,
  LEGEND_BUTTONS,
} from './legendCategories'
import { ELEMENT_BLOCK } from './elementExploreScalars.generated'
import type { ChemicalElement } from './elements'
import {
  lickabilityForElement,
  type LickabilityKey,
} from './elementLickability'
import { ZS_ELEMENT_CORE, type ZsStavLatky } from './zsElementCore'

export type ClassificationSubtype =
  | 'category'
  | 'block'
  | 'metal-type'
  | 'state'
  | 'lickability'

export type ExploreLegendBarButton = {
  id: string
  label: string
  style: string
}

export const CATEGORY_EXPLORE_BUTTONS: readonly ExploreLegendBarButton[] =
  LEGEND_BUTTONS.map((b) => ({
    id: b.id,
    label: b.label,
    style: b.style,
  }))

export const BLOCK_EXPLORE_BUTTONS: readonly ExploreLegendBarButton[] = [
  { id: 's', label: 's-prvky', style: 'block-s' },
  { id: 'p', label: 'p-prvky', style: 'block-p' },
  { id: 'd', label: 'd-prvky', style: 'block-d' },
  { id: 'f', label: 'f-prvky', style: 'block-f' },
]

export const METAL_TYPE_EXPLORE_BUTTONS: readonly ExploreLegendBarButton[] = [
  { id: 'alkali-metal', label: 'Alkalický kov', style: 'alkali' },
  { id: 'alkaline-earth', label: 'Kov alkalických zemin', style: 'alkaline' },
  { id: 'transition', label: 'Přechodný kov', style: 'kovy' },
  { id: 'post-transition', label: 'Kov po přechodných', style: 'kovy' },
  { id: 'metalloid', label: 'Polokov', style: 'polokovy' },
  { id: 'nonmetal', label: 'Nekov', style: 'nekovy' },
  { id: 'halogen', label: 'Halogen', style: 'halogen' },
  { id: 'noble-gas', label: 'Vzácný plyn', style: 'noble' },
  { id: 'lanthanide', label: 'Lanthanoid', style: 'lanthanide' },
  { id: 'actinide', label: 'Aktinoid', style: 'actinide' },
]

export const STATE_EXPLORE_BUTTONS: readonly ExploreLegendBarButton[] = [
  { id: 'pevná', label: 'Pevná', style: 'state-solid' },
  { id: 'kapalná', label: 'Kapalná', style: 'state-liquid' },
  { id: 'plynná', label: 'Plynná', style: 'state-gas' },
]

export const LICKABILITY_EXPLORE_BUTTONS: readonly ExploreLegendBarButton[] = [
  { id: 'yes', label: 'Ano', style: 'oral-yes' },
  { id: 'ambiguous', label: 'Sporné', style: 'oral-ambiguous' },
  { id: 'no', label: 'Ne', style: 'oral-no' },
]

export function classificationButtonsForSubtype(
  subtype: ClassificationSubtype,
): readonly ExploreLegendBarButton[] {
  switch (subtype) {
    case 'category':
      return CATEGORY_EXPLORE_BUTTONS
    case 'block':
      return BLOCK_EXPLORE_BUTTONS
    case 'metal-type':
      return METAL_TYPE_EXPLORE_BUTTONS
    case 'state':
      return STATE_EXPLORE_BUTTONS
    case 'lickability':
      return LICKABILITY_EXPLORE_BUTTONS
    default:
      return CATEGORY_EXPLORE_BUTTONS
  }
}

export function elementMatchesExploreClassification(
  el: ChemicalElement,
  subtype: ClassificationSubtype,
  key: string,
): boolean {
  switch (subtype) {
    case 'category':
      return elementMatchesLegend(el.category, key as LegendCategoryKey)
    case 'block': {
      const b = ELEMENT_BLOCK[el.z]
      return b === key
    }
    case 'metal-type':
      return el.category === (key as ElementCategory)
    case 'state': {
      const st = ZS_ELEMENT_CORE[el.z]?.stavPriStp
      return st === (key as ZsStavLatky)
    }
    case 'lickability':
      return lickabilityForElement(el) === (key as LickabilityKey)
    default:
      return true
  }
}
