import type { ZsStavLatky } from './zsElementCore'

export type PtTileMarkerKind = 'kapalne' | 'plynne' | 'radioaktivni' | 'umele'

export interface PtTileMarkers {
  topLeft: PtTileMarkerKind | null
  bottomLeft: PtTileMarkerKind | null
}

/** Bez stabilního izotopu / radioaktivní značka ve školní tabulce (od Po výš + Tc, Pm). */
function isRadioactiveForTile(z: number): boolean {
  return z === 43 || z === 61 || (z >= 84 && z <= 118)
}

/** Uměle připravovaný prvek (Technecium, Promethium, transuranové 93–118). */
function isSyntheticForTile(z: number): boolean {
  return z === 43 || z === 61 || (z >= 93 && z <= 118)
}

function stateMarker(stav: ZsStavLatky): PtTileMarkerKind | null {
  if (stav === 'kapalná') return 'kapalne'
  if (stav === 'plynná') return 'plynne'
  return null
}

/**
 * Levý horní roh: radioaktivita má přednost, jinak plyn/kapalina (ne pevná látka).
 * Levý dolní roh: při radioaktivitě výše se zde dává druhá značka — stav nebo „umělé“.
 */
export function tileMarkersFromCore(
  z: number,
  stavPriStp: ZsStavLatky,
): PtTileMarkers {
  const state = stateMarker(stavPriStp)
  const radioactive = isRadioactiveForTile(z)
  const synthetic = isSyntheticForTile(z)

  if (radioactive) {
    const bottom: PtTileMarkerKind | null = state ?? (synthetic ? 'umele' : null)
    return { topLeft: 'radioaktivni', bottomLeft: bottom }
  }

  return {
    topLeft: state,
    bottomLeft: synthetic ? 'umele' : null,
  }
}
