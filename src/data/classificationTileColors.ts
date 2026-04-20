/**
 * Přepis barev dlaždice jen u podrežimů „blok“ a „stav látky“.
 * Skupiny / typ kovu ponechávají paletu z PeriodicTable.css (jako dřív bez overlay).
 */

import type { ChemicalElement } from './elements'
import { ELEMENT_BLOCK } from './elementExploreScalars.generated'
import {
  eatabilityForElement,
  lickabilityForElement,
  type OralSafetyStatus,
} from './elementLickability'
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

const STATE_FILL: Record<ZsStavLatky, ClassificationTileColors> = {
  ['pevn\u00e1']: quad('#607d8b', '#b0bec5', '#37474f', '#eceff1'),
  ['kapaln\u00e1']: quad('#039be5', '#4fc3f7', '#01579b', '#ffffff'),
  ['plynn\u00e1']: quad('#ff7043', '#ffccbc', '#bf360c', '#1a0505'),
}

const ORAL_STATUS_FILL: Record<OralSafetyStatus, ClassificationTileColors> = {
  yes: quad('#22c55e', '#bbf7d0', '#166534', '#07130a'),
  ambiguous: quad('#f59e0b', '#fde68a', '#b45309', '#1b1304'),
  no: quad('#ef4444', '#fecaca', '#991b1b', '#190505'),
}

export function tileColorsForExploreClassification(
  el: ChemicalElement,
  subtype: 'block' | 'state' | 'lickability' | 'eatability',
): ClassificationTileColors {
  switch (subtype) {
    case 'block': {
      const b = ELEMENT_BLOCK[el.z]
      if (b === 's' || b === 'p' || b === 'd' || b === 'f') return BLOCK[b]
      return NEUTRAL
    }
    case 'state': {
      const st = ZS_ELEMENT_CORE[el.z]?.stavPriStp ?? 'pevná'
      return STATE_FILL[st]
    }
    case 'lickability':
      return ORAL_STATUS_FILL[lickabilityForElement(el)]
    case 'eatability':
      return ORAL_STATUS_FILL[eatabilityForElement(el)]
  }
}
