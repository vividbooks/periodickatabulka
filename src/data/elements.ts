export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

export interface ChemicalElement {
  z: number
  symbol: string
  nameCs: string
  row: number
  col: number
  category: ElementCategory
}

const SYMBOLS = [
  'H',
  'He',
  'Li',
  'Be',
  'B',
  'C',
  'N',
  'O',
  'F',
  'Ne',
  'Na',
  'Mg',
  'Al',
  'Si',
  'P',
  'S',
  'Cl',
  'Ar',
  'K',
  'Ca',
  'Sc',
  'Ti',
  'V',
  'Cr',
  'Mn',
  'Fe',
  'Co',
  'Ni',
  'Cu',
  'Zn',
  'Ga',
  'Ge',
  'As',
  'Se',
  'Br',
  'Kr',
  'Rb',
  'Sr',
  'Y',
  'Zr',
  'Nb',
  'Mo',
  'Tc',
  'Ru',
  'Rh',
  'Pd',
  'Ag',
  'Cd',
  'In',
  'Sn',
  'Sb',
  'Te',
  'I',
  'Xe',
  'Cs',
  'Ba',
  'La',
  'Ce',
  'Pr',
  'Nd',
  'Pm',
  'Sm',
  'Eu',
  'Gd',
  'Tb',
  'Dy',
  'Ho',
  'Er',
  'Tm',
  'Yb',
  'Lu',
  'Hf',
  'Ta',
  'W',
  'Re',
  'Os',
  'Ir',
  'Pt',
  'Au',
  'Hg',
  'Tl',
  'Pb',
  'Bi',
  'Po',
  'At',
  'Rn',
  'Fr',
  'Ra',
  'Ac',
  'Th',
  'Pa',
  'U',
  'Np',
  'Pu',
  'Am',
  'Cm',
  'Bk',
  'Cf',
  'Es',
  'Fm',
  'Md',
  'No',
  'Lr',
  'Rf',
  'Db',
  'Sg',
  'Bh',
  'Hs',
  'Mt',
  'Ds',
  'Rg',
  'Cn',
  'Nh',
  'Fl',
  'Mc',
  'Lv',
  'Ts',
  'Og',
] as const

const CS_NAMES = `Vodík;Helium;Lithium;Beryllium;Bor;Uhlík;Dusík;Kyslík;Fluor;Neon;Sodík;Hořčík;Hliník;Křemík;Fosfor;Síra;Chlor;Argon;Draslík;Vápník;Scandium;Titan;Vanad;Chrom;Mangan;Železo;Kobalt;Nikl;Měď;Zinek;Gallium;Germanium;Arsen;Selen;Brom;Krypton;Rubidium;Stroncium;Yttrium;Zirkonium;Niob;Molybden;Technecium;Ruthenium;Rhodium;Palladium;Stříbro;Kadmium;Indium;Cín;Antimon;Tellur;Jód;Xenon;Cesium;Bárium;Lanthan;Cer;Praseodym;Neodym;Promethium;Samarium;Europium;Gadolinium;Terbium;Dysprosium;Holmium;Erbium;Thulium;Ytterbium;Lutecium;Hafnium;Tantal;Wolfram;Rhenium;Osmium;Iridium;Platina;Zlato;Rtuť;Thallium;Olovo;Bismut;Polonium;Astat;Radon;Francium;Radium;Actinium;Thorium;Protaktinium;Uran;Neptunium;Plutonium;Americium;Curium;Berkelium;Kalifornium;Einsteinium;Fermium;Mendelevium;Nobelium;Lawrencium;Rutherfordium;Dubnium;Seaborgium;Bohrium;Hassium;Meitnerium;Darmstadtium;Roentgenium;Copernicium;Nihonium;Flerovium;Moscovium;Livermorium;Tennessin;Oganesson`.split(
  ';',
)

function gridPosition(z: number): { row: number; col: number } {
  if (z <= 2) {
    if (z === 1) return { row: 1, col: 1 }
    return { row: 1, col: 18 }
  }
  if (z <= 10) {
    const map: Record<number, [number, number]> = {
      3: [2, 1],
      4: [2, 2],
      5: [2, 13],
      6: [2, 14],
      7: [2, 15],
      8: [2, 16],
      9: [2, 17],
      10: [2, 18],
    }
    const [row, col] = map[z]
    return { row, col }
  }
  if (z <= 18) {
    const map: Record<number, [number, number]> = {
      11: [3, 1],
      12: [3, 2],
      13: [3, 13],
      14: [3, 14],
      15: [3, 15],
      16: [3, 16],
      17: [3, 17],
      18: [3, 18],
    }
    const [row, col] = map[z]
    return { row, col }
  }
  if (z <= 36) return { row: 4, col: z - 18 }
  if (z <= 54) return { row: 5, col: z - 36 }
  if (z <= 56) return { row: 6, col: z - 54 }
  if (z === 57) return { row: 6, col: 3 }
  if (z >= 58 && z <= 71) return { row: 8, col: z - 58 + 4 }
  if (z >= 72 && z <= 86) return { row: 6, col: z - 72 + 4 }
  if (z <= 88) return { row: 7, col: z - 86 }
  if (z === 89) return { row: 7, col: 3 }
  if (z >= 90 && z <= 103) return { row: 9, col: z - 90 + 4 }
  if (z >= 104) return { row: 7, col: z - 104 + 4 }
  return { row: 1, col: 1 }
}

/** 32 sloupců: ř. 1–3 stejně „roztažené“ jako 4–7 (p-blok vpravo nad Ga… / Br…). */
function gridPositionExpanded(z: number): { row: number; col: number } {
  if (z <= 2) {
    if (z === 1) return { row: 1, col: 1 }
    return { row: 1, col: 32 }
  }
  /* Perioda 2: Li, Be | prázdné 3–26 | B…Ne ve sl. 27–32 (skupiny 13–18 nad Ga…Kr) */
  if (z <= 10) {
    if (z <= 4) {
      const map: Record<number, [number, number]> = {
        3: [2, 1],
        4: [2, 2],
      }
      const [row, col] = map[z]
      return { row, col }
    }
    return { row: 2, col: z - 5 + 27 }
  }
  /* Perioda 3: Na, Mg | prázdné 3–26 | Al…Ar ve sl. 27–32 */
  if (z <= 18) {
    if (z <= 12) {
      const map: Record<number, [number, number]> = {
        11: [3, 1],
        12: [3, 2],
      }
      const [row, col] = map[z]
      return { row, col }
    }
    return { row: 3, col: z - 13 + 27 }
  }
  /*
   * Řádky 4–5: stejné 32 sl. jako 6–7. K, Ca / Rb, Sr ve sl. 1–2; sl. 3–16 prázdné
   * (nad Ce–Yb / Th–No); Sc…Kr resp. Y…Xe ve sl. 17–32 pod Lu…Rn / Lr…Og.
   */
  if (z >= 19 && z <= 36) {
    if (z <= 20) return { row: 4, col: z - 18 }
    return { row: 4, col: z - 21 + 17 }
  }
  if (z >= 37 && z <= 54) {
    if (z <= 38) return { row: 5, col: z - 36 }
    return { row: 5, col: z - 39 + 17 }
  }
  if (z <= 56) return { row: 6, col: z - 54 }
  if (z === 57) return { row: 6, col: 3 }
  if (z >= 58 && z <= 71) return { row: 6, col: z - 58 + 4 }
  if (z >= 72 && z <= 86) return { row: 6, col: z - 72 + 18 }
  if (z <= 88) return { row: 7, col: z - 86 }
  if (z === 89) return { row: 7, col: 3 }
  if (z >= 90 && z <= 103) return { row: 7, col: z - 90 + 4 }
  if (z >= 104) return { row: 7, col: z - 104 + 18 }
  return { row: 1, col: 1 }
}

export type PeriodicTableLayoutMode = 'compact' | 'expanded'

export function gridPositionForLayout(
  z: number,
  mode: PeriodicTableLayoutMode,
): { row: number; col: number } {
  return mode === 'expanded' ? gridPositionExpanded(z) : gridPosition(z)
}

export type GridNavDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Další prvek v daném směru po buňkách mřížky (prázdné buňky přeskočí).
 * Vrací null, když v tom směru už žádný prvek není.
 */
export function neighborElementInDirection(
  z: number,
  layoutMode: PeriodicTableLayoutMode,
  direction: GridNavDirection,
): ChemicalElement | null {
  const { cols, rows } = periodicTableGridDimensions(layoutMode)
  const byKey = new Map<string, ChemicalElement>()
  for (const el of ELEMENTS) {
    const pos = gridPositionForLayout(el.z, layoutMode)
    byKey.set(`${pos.row},${pos.col}`, el)
  }
  const dr =
    direction === 'up' ? -1 : direction === 'down' ? 1 : 0
  const dc =
    direction === 'left' ? -1 : direction === 'right' ? 1 : 0
  let { row, col } = gridPositionForLayout(z, layoutMode)
  while (true) {
    row += dr
    col += dc
    if (row < 1 || row > rows || col < 1 || col > cols) return null
    const el = byKey.get(`${row},${col}`)
    if (el) return el
  }
}

export function periodicTableGridDimensions(mode: PeriodicTableLayoutMode): {
  cols: number
  rows: number
} {
  return mode === 'expanded'
    ? { cols: 32, rows: 7 }
    : { cols: 18, rows: 9 }
}

function categoryForZ(z: number): ElementCategory {
  if (z >= 58 && z <= 71) return 'lanthanide'
  if (z >= 90 && z <= 103) return 'actinide'
  if (z === 57) return 'lanthanide'
  if (z === 89) return 'actinide'
  if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alkali-metal'
  if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alkaline-earth'
  const transition = new Set([
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 72, 73, 74,
    75, 76, 77, 78, 79, 80, 104, 105, 106, 107, 108, 109, 110, 111, 112,
  ])
  if (transition.has(z)) return 'transition'
  if ([13, 31, 49, 50, 81, 82, 83, 113, 114, 115, 116].includes(z))
    return 'post-transition'
  if ([5, 14, 32, 33, 34, 51, 52, 84].includes(z)) return 'metalloid'
  if ([1, 6, 7, 8, 15, 16].includes(z)) return 'nonmetal'
  if ([9, 17, 35, 53, 85, 117].includes(z)) return 'halogen'
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'noble-gas'
  return 'nonmetal'
}

export const ELEMENTS: ChemicalElement[] = SYMBOLS.map((symbol, i) => {
  const z = i + 1
  const { row, col } = gridPosition(z)
  return {
    z,
    symbol,
    nameCs: CS_NAMES[i] ?? symbol,
    row,
    col,
    category: categoryForZ(z),
  }
})

export const GRID_COLS = 18
export const GRID_ROWS = 9

/** Musí odpovídat `PeriodicTable.css` → `--pt-cell`. */
export const PERIODIC_TABLE_CELL_PX = 150

/** Musí odpovídat `useInfiniteCanvas.ts` → `MIN_ZOOM` / `MAX_ZOOM`. */
export const PERIODIC_TABLE_ZOOM_MIN = 0.18
export const PERIODIC_TABLE_ZOOM_MAX = 4

/** Musí odpovídat `PeriodicTable.css` → `--pt-gap`. Škáluje je jen `scale(zoom)` plátna. */
export const PERIODIC_TABLE_GAP_PX = 6

/**
 * Osa = jedna dlaždice jako prvek (š × v buňky) — musí odpovídat `--pt-axis-col` / `--pt-axis-row` v PeriodicTable.css.
 */
export const PERIODIC_TABLE_AXIS_COL_PX = PERIODIC_TABLE_CELL_PX
export const PERIODIC_TABLE_AXIS_ROW_PX = PERIODIC_TABLE_CELL_PX

/**
 * Extra výška pod rozšířenou mřížkou (bobánek pod Ac).
 * Musí odpovídat `PeriodicTable.css` → `.periodic-table-grid-wrap--expanded { padding-bottom }`.
 */
export const PERIODIC_TABLE_EXPANDED_NUB_EXTRA_PX = 52

/** Vnější rozměr mřížky v pixelech obsahu (padding = gap), včetně os. */
export function periodicTableOuterSizeForGrid(
  cols: number,
  rows: number,
  gap: number = PERIODIC_TABLE_GAP_PX,
): { width: number; height: number } {
  const cell = PERIODIC_TABLE_CELL_PX
  const pad = gap
  const underShift = cell * 0.05
  const rowGap = gap + underShift
  const axisCol = PERIODIC_TABLE_AXIS_COL_PX
  const axisRow = PERIODIC_TABLE_AXIS_ROW_PX
  /* mezera mezi osami a dlaždicemi */
  const axisG = gap
  const width =
    pad * 2 +
    axisCol +
    axisG +
    cols * cell +
    Math.max(0, cols - 1) * gap
  const height =
    pad * 2 +
    axisRow +
    axisG +
    rows * cell +
    Math.max(0, rows - 1) * rowGap
  return { width, height }
}

export function periodicTableOuterSizePxForLayout(
  mode: PeriodicTableLayoutMode,
): { width: number; height: number } {
  const { cols, rows } = periodicTableGridDimensions(mode)
  const base = periodicTableOuterSizeForGrid(cols, rows, PERIODIC_TABLE_GAP_PX)
  if (mode === 'expanded') {
    return {
      width: base.width,
      height: base.height + PERIODIC_TABLE_EXPANDED_NUB_EXTRA_PX,
    }
  }
  return base
}

export function periodicTableOuterSizePx(): { width: number; height: number } {
  return periodicTableOuterSizePxForLayout('compact')
}

/**
 * Obdélník buňky prvku v pixelech od levého horního rohu `.periodic-table-root`
 * (stejný souřadnicový systém jako dítě `infinite-canvas-world`). Musí sedět s
 * `PeriodicTable.css`: padding panelu, osy a `column-gap` / `row-gap` mřížky.
 */
export function elementCellRectInPeriodicTableRootPx(
  z: number,
  layoutMode: PeriodicTableLayoutMode,
): { x: number; y: number; width: number; height: number } {
  const { row, col } = gridPositionForLayout(z, layoutMode)
  const cell = PERIODIC_TABLE_CELL_PX
  const gap = PERIODIC_TABLE_GAP_PX
  const axis = PERIODIC_TABLE_AXIS_COL_PX
  const pad = gap
  const rowGap = gap + cell * 0.05
  const gridCoreLeft = pad + axis + gap
  const gridCoreTop = pad + PERIODIC_TABLE_AXIS_ROW_PX + gap
  const colStep = cell + gap
  const rowStep = cell + rowGap
  return {
    x: gridCoreLeft + (col - 1) * colStep,
    y: gridCoreTop + (row - 1) * rowStep,
    width: cell,
    height: cell,
  }
}
