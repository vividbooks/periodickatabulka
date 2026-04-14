/**
 * Barvy tváře dlaždice podle režimu „Klasifikace“ (stejná logika jako legenda / zperiod styl).
 */

import type { ClassificationSubtype } from './classificationExplore'
import type { ChemicalElement, ElementCategory } from './elements'
import { ELEMENT_BLOCK } from './elementExploreScalars.generated'
import { ZS_ELEMENT_CORE, type ZsStavLatky } from './zsElementCore'

export type ClassificationTileColors = {
  face: string
  rimTop: string
  rimBot: string
  ink: string
}

function quad(
  face: string,
  rimTop: string,
  rimBot: string,
  ink: string,
): ClassificationTileColors {
  return { face, rimTop, rimBot, ink }
}

/** Neznámý blok / bez údaje */
const NEUTRAL = quad('#546e7a', '#90a4ae', '#37474f', '#eceff1')

/** s = červená, p = modrá, d = zlatá, f = zelená (viz referenční PT) */
const BLOCK: Record<'s' | 'p' | 'd' | 'f', ClassificationTileColors> = {
  s: quad('#ef5350', '#ffcdd2', '#b71c1c', '#1a0505'),
  p: quad('#42a5f5', '#90caf9', '#0d47a1', '#ffffff'),
  d: quad('#ffca28', '#ffe082', '#e65100', '#3e2723'),
  f: quad('#66bb6a', '#c8e6c9', '#1b5e20', '#0d1f0d'),
}

const ELEMENT_CATEGORY_FILL: Record<ElementCategory, ClassificationTileColors> =
  {
    'alkali-metal': quad('#283593', '#5c6bc0', '#1a237e', '#e8eaf6'),
    'alkaline-earth': quad('#6a1b9a', '#9c27b0', '#4a148c', '#f3e5f5'),
    transition: quad('#ffee58', '#fff59d', '#f57f17', '#3e2723'),
    'post-transition': quad('#fdd835', '#ffeb3b', '#f9a825', '#3e2723'),
    metalloid: quad('#ff7043', '#ffab91', '#d84315', '#1a0505'),
    nonmetal: quad('#42a5f5', '#90caf9', '#1565c0', '#ffffff'),
    halogen: quad('#37474f', '#607d8b', '#263238', '#eceff1'),
    'noble-gas': quad('#00838f', '#4dd0e1', '#004d40', '#e0f7fa'),
    lanthanide: quad('#2e7d32', '#81c784', '#1b5e20', '#e8f5e9'),
    actinide: quad('#6a1b9a', '#ba68c8', '#38006b', '#f3e5f5'),
  }

const STATE_FILL: Record<ZsStavLatky, ClassificationTileColors> = {
  ['pevn\u00e1']: quad('#607d8b', '#b0bec5', '#37474f', '#eceff1'),
  ['kapaln\u00e1']: quad('#039be5', '#4fc3f7', '#01579b', '#ffffff'),
  ['plynn\u00e1']: quad('#ff7043', '#ffccbc', '#bf360c', '#1a0505'),
}

export function tileColorsForExploreClassification(
  el: ChemicalElement,
  subtype: ClassificationSubtype,
): ClassificationTileColors {
  switch (subtype) {
    case 'block': {
      const b = ELEMENT_BLOCK[el.z]
      if (b === 's' || b === 'p' || b === 'd' || b === 'f') return BLOCK[b]
      return NEUTRAL
    }
    case 'category':
    case 'metal-type':
      return ELEMENT_CATEGORY_FILL[el.category]
    case 'state': {
      const st = ZS_ELEMENT_CORE[el.z]?.stavPriStp ?? 'pevná'
      return STATE_FILL[st]
    }
    default:
      return NEUTRAL
  }
}
