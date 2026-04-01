import type {
  ChemicalElement,
  ElementCategory,
  PeriodicTableLayoutMode,
} from './elements'

function categorySentence(cat: ElementCategory): string {
  switch (cat) {
    case 'alkali-metal':
      return 'alkalické kovy — typicky jeden valenční elektron.'
    case 'alkaline-earth':
      return 'kovy alkalických zemin — dva valenční elektrony.'
    case 'transition':
      return 'přechodné kovy — d-prvky s mnoha společnými chemickými vlastnostmi.'
    case 'post-transition':
      return 'postpřechodné kovy.'
    case 'metalloid':
      return 'polokovy — vlastnosti mezi kovy a nekovy.'
    case 'nonmetal':
      return 'nekovy — kovalentní vazby, proměnlivé vlastnosti.'
    case 'halogen':
      return 'halogeny — vysoce reaktivní nekovy.'
    case 'noble-gas':
      return 'vzácné plyny — stabilní obal, malá reaktivita.'
    case 'lanthanide':
      return 'lanthanoidy — velmi podobné vlastnosti, zaplňování 4f orbitalů.'
    case 'actinide':
      return 'aktinoidy — radioaktivní kovy, 5f orbitaly.'
    default:
      return ''
  }
}

const COMPACT_GROUP_HINT: Record<number, string> = {
  1: 'Skupina 1 (IUPAC) — alkalické kovy; vodík je chemicky výjimka.',
  2: 'Skupina 2 — kovy alkalických zemin.',
  3: 'Skupina 3 — začátek d-bloku (Sc, Y, La/Ac …).',
  4: 'Skupina 4 — přechodné kovy (Ti, Zr, Hf …).',
  5: 'Skupina 5 — přechodné kovy (V, Nb, Ta …).',
  6: 'Skupina 6 — přechodné kovy (Cr, Mo, W …).',
  7: 'Skupina 7 — přechodné kovy (Mn, Tc, Re …).',
  8: 'Skupina 8 — železné kovy (Fe, Ru, Os …).',
  9: 'Skupina 9 — kobaltová triáda (Co, Rh, Ir …).',
  10: 'Skupina 10 — niklová triáda (Ni, Pd, Pt …).',
  11: 'Skupina 11 — měděné kovy (Cu, Ag, Au …).',
  12: 'Skupina 12 — zinkové kovy (Zn, Cd, Hg …).',
  13: 'Skupina 13 — triely / borová skupina.',
  14: 'Skupina 14 — uhlíková skupina (C až Pb).',
  15: 'Skupina 15 — pniktogeny (N až Bi).',
  16: 'Skupina 16 — chalkogeny (O až Po).',
  17: 'Skupina 17 — halogeny.',
  18: 'Skupina 18 — vzácné plyny.',
}

function uniqueCategories(els: ChemicalElement[]): ElementCategory[] {
  return [...new Set(els.map((e) => e.category))]
}

function rowHint(
  gridRow: number,
  layoutMode: PeriodicTableLayoutMode,
  els: ChemicalElement[],
): string {
  if (layoutMode === 'compact' && gridRow === 8) {
    return 'Řádek lanthanoidů — perioda 6, 4f prvky; chemicky velmi podobné kovy.'
  }
  if (layoutMode === 'compact' && gridRow === 9) {
    return 'Řádek aktinoidů — perioda 7, 5f prvky; převážně radioaktivní kovy.'
  }
  const n = gridRow
  if (layoutMode === 'expanded' || (layoutMode === 'compact' && n >= 1 && n <= 7)) {
    if (n === 1) {
      return 'Perioda 1 — pouze vodík a helium; jediná obsazená slupka je K.'
    }
    const cats = uniqueCategories(els)
    const tail =
      cats.length === 1 && cats[0] != null
        ? ` ${categorySentence(cats[0]).replace(/^\w/, (x) => x.toUpperCase())}`
        : ''
    return `Perioda ${n} — valenční elektrony na hlavní kvantové hladině n = ${n}.${tail}`
  }
  return ''
}

function colHint(
  gridCol: number,
  layoutMode: PeriodicTableLayoutMode,
  els: ChemicalElement[],
): string {
  if (els.length === 0) {
    return ''
  }
  if (layoutMode === 'compact') {
    const g = COMPACT_GROUP_HINT[gridCol]
    if (g) return g
    return ''
  }
  const cats = uniqueCategories(els)
  if (cats.length === 1 && cats[0] != null) {
    const s = categorySentence(cats[0])
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  return ''
}

/**
 * Rozšířená tabulka (32 sl.): čísla IUPAC skupin 1–18 podle sloupce, ne 1–32.
 * Sloupce 3–16 = mezera / f-oblast — bez čísla v záhlaví (viz prázdné místo mezi 2 a d-blokem).
 */
export function expandedColumnHeaderLabel(gridCol: number): string | null {
  if (gridCol < 1 || gridCol > 32) return null
  if (gridCol <= 2) return String(gridCol)
  if (gridCol <= 16) return null
  return String(gridCol - 14)
}

export function axisBandHint(
  kind: 'row' | 'col',
  index: number,
  layoutMode: PeriodicTableLayoutMode,
  elementsInBand: ChemicalElement[],
): string {
  return kind === 'row'
    ? rowHint(index, layoutMode, elementsInBand)
    : colHint(index, layoutMode, elementsInBand)
}
