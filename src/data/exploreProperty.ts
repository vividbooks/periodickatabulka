/** Jednotný režim spodní lišty: klasifikace (bobánky) / škála vlastnosti (slider). */

import type { ClassificationSubtype } from './classificationExplore'

export type PropertyExploreKey =
  | 'melting-point'
  | 'boiling-point'
  | 'density'
  | 'electronegativity'
  | 'ionization'
  | 'electron-affinity'
  | 'atomic-radius'
  | 'specific-heat'
  | 'discovery-year'
  | 'earth-abundance'

export type ExplorePropertyState =
  | {
      kind: 'classification'
      subtype: ClassificationSubtype
      clicked: string | null
      hovered: string | null
    }
  | {
      kind: 'property'
      property: PropertyExploreKey
      rangeMin: number
      rangeMax: number
    }

/** Výchozí = první položka v selectu (skupiny), bez aktivního filtru bobánkem. */
export const DEFAULT_EXPLORE_PROPERTY_STATE: ExplorePropertyState = {
  kind: 'classification',
  subtype: 'category',
  clicked: null,
  hovered: null,
}

/** Klíč aktivního filtru klasifikace (hover má přednost), jinak null. */
export function exploreClassificationActiveKey(
  state: ExplorePropertyState,
): string | null {
  if (state.kind !== 'classification') return null
  return state.hovered ?? state.clicked
}
