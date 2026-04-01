import type { CSSProperties, ReactNode } from 'react'
import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  ELEMENTS,
  PERIODIC_TABLE_CELL_PX,
  PERIODIC_TABLE_GAP_PX,
  elementCellCenterInPeriodicTableGridPx,
  gridPositionForLayout,
  neighborElementInDirection,
  periodicTableGridDimensions,
  type ChemicalElement,
  type ElementCategory,
  type GridNavDirection,
  type PeriodicTableLayoutMode,
} from '../data/elements'
import {
  elementMatchesLegend,
  type LegendCategoryKey,
} from '../data/legendCategories'
import { ELEMENT_LATIN_PAREN } from '../data/elementLatinParen'
import {
  axisBandHint,
  expandedColumnHeaderLabel,
} from '../data/axisHints'
import { tileMarkersFromCore } from '../data/elementTileMarkers'
import { ZS_ELEMENT_CORE } from '../data/zsElementCore'
import { PT_MARKER_TITLES, PtMarkerSvg, PtTileMarkers } from './PtTileMarkers'
import './PeriodicTable.css'

type AxisHover = { kind: 'col' | 'row'; index: number }

type Props = {
  /** Měřítko plátna (větší = detailnější dlaždice → více vrstev údajů). */
  zoom: number
  /** Kompaktní = La/Ac + oddělené řádky a šipky; rozšířená = Ce–Lu / Th–Lr v řádcích 6–7 (32 sloupců). */
  layoutMode: PeriodicTableLayoutMode
  selectedZ: number | null
  onSelect: (el: ChemicalElement | null) => void
  /** Kompaktní režim: klik na bobánek u fialové šipky rozšíří tabulku. */
  onExpandLayout?: () => void
  /** Rozšířený režim: klik na bobánek pod Ac přepne zpět na kompaktní rozvržení. */
  onCompactLayout?: () => void
  /** Legenda dole: hover má přednost; null = bez filtru podle skupiny. */
  legendHighlight: LegendCategoryKey | null
  /** Rozměry plátna (`.infinite-canvas-viewport`) — pro omezení 3× zvětšení při silném zoomu. */
  viewportWidth: number
  viewportHeight: number
  /** Přepnutí na sousední prvek (šipky u rozkliknuté buňky + klávesnice v App). */
  onNavigate: (dir: GridNavDirection) => void
  /** V celoobrazovkovém inspektoru šipky u buňky skrýt. */
  inspectorFullscreen: boolean
}

/** Prah v pixelech strany buňky na obrazovce (š × zoom), dříve ekvivalent 118×zoom. */
const LOD_CELL_EDGE_PX = [47.2, 68.44, 92.04, 123.9] as const

/** 0 = jen značka … 4 = komplet vč. χ, latiny a rohových značek (viz CSS [data-pt-lod]). */
function detailLevelForZoom(zoom: number): 0 | 1 | 2 | 3 | 4 {
  const edgePx = PERIODIC_TABLE_CELL_PX * zoom
  if (edgePx < LOD_CELL_EDGE_PX[0]) return 0
  if (edgePx < LOD_CELL_EDGE_PX[1]) return 1
  if (edgePx < LOD_CELL_EDGE_PX[2]) return 2
  if (edgePx < LOD_CELL_EDGE_PX[3]) return 3
  return 4
}

/** Max. zvětšení rozkliknuté dlaždice; při velkém zoomu snížit, ať strana buňky × scale nepřeteče viewport. */
const SELECTED_TILE_SCALE_MAX = 3
const SELECTED_TILE_SCALE_MIN = 1
/** Podíl menší strany viewportu jako horní odhad pro stranu zvětšené dlaždice (okraje). */
const SELECTED_TILE_VIEWPORT_CAP = 0.88

function selectedTileScaleForViewport(
  zoom: number,
  viewportW: number,
  viewportH: number,
): number {
  if (viewportW < 16 || viewportH < 16) return SELECTED_TILE_SCALE_MAX
  const cellEdgeScreenPx = PERIODIC_TABLE_CELL_PX * zoom
  if (cellEdgeScreenPx < 0.5) return SELECTED_TILE_SCALE_MAX
  const capEdge = Math.min(viewportW, viewportH) * SELECTED_TILE_VIEWPORT_CAP
  const raw = capEdge / cellEdgeScreenPx
  return Math.max(
    SELECTED_TILE_SCALE_MIN,
    Math.min(SELECTED_TILE_SCALE_MAX, raw),
  )
}

/** Ar v dlaždici: max. 2 des. místa, desetinná čárka (cs). */
function formatArForTile(ar: string): string {
  if (!ar || ar === '—' || ar.trim() === '') return ar
  const n = Number.parseFloat(ar.replace(',', '.').replace(/\s/g, ''))
  if (!Number.isFinite(n)) return ar
  const rounded = Math.round(n * 100) / 100
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded)
}

/** Be, Mg: stejná horní/spodní paleta jako ostatní „klasické“ kovy (.pt-fill-kov). */
const ALKALINE_EARTH_NO_GROUP_RING = new Set([4, 12])

function groupRingClass(cat: ElementCategory, z: number): string {
  if (cat === 'alkali-metal') return 'pt-ring-alkali'
  if (cat === 'alkaline-earth') {
    if (ALKALINE_EARTH_NO_GROUP_RING.has(z)) return ''
    return 'pt-ring-alkaline-earth'
  }
  if (cat === 'halogen') return 'pt-ring-halogen'
  if (cat === 'noble-gas') return 'pt-ring-noble'
  if (cat === 'lanthanide') return 'pt-ring-lanthanide'
  if (cat === 'actinide') return 'pt-ring-actinide'
  return ''
}

function tileFamilyClass(cat: ElementCategory): string {
  if (cat === 'metalloid') return 'pt-fill-metalloid'
  if (
    cat === 'nonmetal' ||
    cat === 'halogen' ||
    cat === 'noble-gas'
  ) {
    return 'pt-fill-nekov'
  }
  return 'pt-fill-kov'
}

/** Ca, Sr, Ba, Ra ve druhém sloupci — vlastní červená paleta. */
const COL2_CA_SR_BA_RA = new Set([20, 38, 56, 88])

function col2CaRaClass(z: number, col: number): string {
  return col === 2 && COL2_CA_SR_BA_RA.has(z) ? 'pt-col-2-ca-ra' : ''
}

/** Uhlík, dusík, kyslík, fosfor, síra — vlastní obrys a podložka. */
const NONMETAL_CNOPS_Z = new Set([6, 7, 8, 15, 16])

function nonmetalCnopsClass(z: number, cat: ElementCategory): string {
  return cat === 'nonmetal' && NONMETAL_CNOPS_Z.has(z)
    ? 'pt-nonmetal-cnops'
    : ''
}

function astatineTileClass(z: number): string {
  return z === 85 ? 'pt-element-at' : ''
}

/** Číslo periody u řádku mřížky (kompaktně 8–9 = opakované 6 a 7 pro f-řádky). */
function periodLabelForGridRow(
  row: number,
  mode: PeriodicTableLayoutMode,
): string {
  if (mode === 'expanded') return String(row)
  if (row <= 7) return String(row)
  if (row === 8) return '6'
  return '7'
}

/** Zaoblený „L“ tah: kolmice dolů, oblouk, vodorovně k Ce / Th. */
function roundedConnectorPath(
  xVert: number,
  yTop: number,
  yElbowY: number,
  xTarget: number,
  cornerR: number,
): string {
  const ey = yElbowY
  const r = Math.max(
    4,
    Math.min(cornerR, (xTarget - xVert - 2) * 0.45, (ey - yTop) * 0.45),
  )
  /* sweep 0 = vnější konvexní roh (dole vpravo); sweep 1 dával „vykousnutý“ konkávní oblouk */
  return `M ${xVert} ${yTop} L ${xVert} ${ey - r} A ${r} ${r} 0 0 0 ${xVert + r} ${ey} L ${xTarget} ${ey}`
}

/** La → Ce, Ac → Th + volitelný bobánek rozšíření (pod fialovou šipkou). */
function FBlockCompactOverlays({
  onExpand,
}: {
  onExpand?: () => void
}) {
  const cols = 18
  const rows = 9
  const C = PERIODIC_TABLE_CELL_PX
  const G = PERIODIC_TABLE_GAP_PX
  const rowGap = G + C * 0.05
  const w = cols * C + (cols - 1) * G
  const h = rows * C + (rows - 1) * rowGap
  const cellX = (c: number) => (c - 1) * (C + G)
  const cellY = (r: number) => (r - 1) * (C + rowGap)
  const centerX = (c: number) => cellX(c) + C / 2
  const midY = (r: number) => cellY(r) + C / 2

  const cornerR = 22
  const laBottom = cellY(6) + C
  const ceY = midY(8)
  const ceLeft = cellX(4) + C * 0.12
  const dLan = roundedConnectorPath(centerX(3), laBottom, ceY, ceLeft, cornerR)

  const acBottom = cellY(7) + C
  const thY = midY(9)
  const thLeft = cellX(4) + C * 0.12
  const xActVert = centerX(3) - C * 0.28
  const dAct = roundedConnectorPath(xActVert, acBottom, thY, thLeft, cornerR)

  /* Stejný sloupec jako La / Ac (col 3) — horizontálně uprostřed buňky */
  const nubCenterX = centerX(3)
  /* Mezera pod vodorovnou částí fialové šipky */
  const nubTop = thY + 12

  return (
    <>
      <svg
        className="pt-fblock-arrows"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        aria-hidden
      >
        <defs>
          <marker
            id="pt-arrowhead-lan"
            markerWidth="15"
            markerHeight="15"
            refX="13"
            refY="7.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M0.8 1.5 L13 7.5 L0.8 13.5 Z"
              className="pt-fblock-arrows__head-lan"
            />
          </marker>
          <marker
            id="pt-arrowhead-act"
            markerWidth="15"
            markerHeight="15"
            refX="13"
            refY="7.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M0.8 1.5 L13 7.5 L0.8 13.5 Z"
              className="pt-fblock-arrows__head-act"
            />
          </marker>
        </defs>
        <path
          d={dLan}
          className="pt-fblock-arrows__path pt-fblock-arrows__path--lan"
          markerEnd="url(#pt-arrowhead-lan)"
        />
        <path
          d={dAct}
          className="pt-fblock-arrows__path pt-fblock-arrows__path--act"
          markerEnd="url(#pt-arrowhead-act)"
        />
      </svg>
      {onExpand ? (
        <button
          type="button"
          className="pt-fblock-expand-nub"
          style={{ left: nubCenterX, top: nubTop }}
          aria-label="Zarovnat vedle — rozšířit tabulku o f-blok v řádcích"
          title="Rozšířit tabulku"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onExpand()
          }}
        >
          Zarovnat vedle
        </button>
      ) : null}
    </>
  )
}

/** Rozšířená tabulka: stejný bobánek pod dlaždicí Ac → zpět na kompaktní mřížku. */
function FBlockExpandedCompactNub({
  onCompact,
}: {
  onCompact?: () => void
}) {
  const C = PERIODIC_TABLE_CELL_PX
  const G = PERIODIC_TABLE_GAP_PX
  const rowGap = G + C * 0.05
  const cellX = (c: number) => (c - 1) * (C + G)
  const cellY = (r: number) => (r - 1) * (C + rowGap)
  const centerX = (c: number) => cellX(c) + C / 2

  const acRow = 7
  const acCol = 3
  const nubCenterX = centerX(acCol)
  const nubTop = cellY(acRow) + C + 12

  return onCompact ? (
    <button
      type="button"
      className="pt-fblock-expand-nub"
      style={{ left: nubCenterX, top: nubTop }}
      aria-label="Zarovnat pod — zabalit tabulku do samostatných řádků se šipkami"
      title="Zabalit tabulku"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onCompact()
      }}
    >
      Zarovnat pod
    </button>
  ) : null
}

function PeriodicTableInner({
  zoom,
  layoutMode,
  selectedZ,
  onSelect,
  onExpandLayout,
  onCompactLayout,
  legendHighlight,
  viewportWidth,
  viewportHeight,
  onNavigate,
  inspectorFullscreen,
}: Props) {
  const lod = detailLevelForZoom(zoom)
  const selectedTileScale = useMemo(
    () =>
      selectedTileScaleForViewport(zoom, viewportWidth, viewportHeight),
    [zoom, viewportWidth, viewportHeight],
  )

  const navNeighbors = useMemo(() => {
    if (selectedZ == null) {
      return { up: null, down: null, left: null, right: null } as const
    }
    return {
      up: neighborElementInDirection(selectedZ, layoutMode, 'up'),
      down: neighborElementInDirection(selectedZ, layoutMode, 'down'),
      left: neighborElementInDirection(selectedZ, layoutMode, 'left'),
      right: neighborElementInDirection(selectedZ, layoutMode, 'right'),
    }
  }, [selectedZ, layoutMode])

  const navCenter = useMemo(() => {
    if (selectedZ == null) return null
    return elementCellCenterInPeriodicTableGridPx(selectedZ, layoutMode)
  }, [selectedZ, layoutMode])

  /* Po navigaci šipkami zůstával focus na předchozí buňce → obrys :focus-visible; přesuneme focus na aktuální výběr. */
  useLayoutEffect(() => {
    if (selectedZ == null) {
      const active = document.activeElement
      if (active instanceof HTMLElement && active.classList.contains('pt-cell')) {
        active.blur()
      }
      return
    }
    const wrap = document.querySelector<HTMLElement>(
      `[data-pt-element-z="${String(selectedZ)}"]`,
    )
    const btn = wrap?.querySelector<HTMLButtonElement>('button.pt-cell')
    if (btn) {
      btn.focus({ preventScroll: true })
    }
  }, [selectedZ])

  const { cols: gridCols, rows: gridRows } =
    periodicTableGridDimensions(layoutMode)
  const [axisHover, setAxisHover] = useState<AxisHover | null>(null)
  /* Při otevřeném detailu prvku nezobrazovat pásmo osy ani nezamlžovat mřížku podle osy. */
  const effectiveAxisHover = selectedZ != null ? null : axisHover

  useEffect(() => {
    if (selectedZ != null) setAxisHover(null)
  }, [selectedZ])

  const byKey = new Map<string, ChemicalElement>()
  for (const el of ELEMENTS) {
    const pos = gridPositionForLayout(el.z, layoutMode)
    byKey.set(`${pos.row},${pos.col}`, el)
  }

  let axisCaption: string | null = null
  if (effectiveAxisHover != null) {
    const els: ChemicalElement[] = []
    if (effectiveAxisHover.kind === 'col') {
      for (let r = 1; r <= gridRows; r++) {
        const el = byKey.get(`${r},${effectiveAxisHover.index}`)
        if (el) els.push(el)
      }
    } else {
      for (let c = 1; c <= gridCols; c++) {
        const el = byKey.get(`${effectiveAxisHover.index},${c}`)
        if (el) els.push(el)
      }
    }
    const raw = axisBandHint(
      effectiveAxisHover.kind,
      effectiveAxisHover.index,
      layoutMode,
      els,
    ).trim()
    if (raw.length > 0) axisCaption = raw
  }

  const cells: ReactNode[] = []
  for (let row = 1; row <= gridRows; row++) {
    for (let col = 1; col <= gridCols; col++) {
      const el = byKey.get(`${row},${col}`)
      const inAxisBand =
        effectiveAxisHover == null ||
        (effectiveAxisHover.kind === 'col' && col === effectiveAxisHover.index) ||
        (effectiveAxisHover.kind === 'row' && row === effectiveAxisHover.index)
      if (el) {
        const selected = el.z === selectedZ
        const legendMatch =
          legendHighlight == null ||
          elementMatchesLegend(el.category, legendHighlight)
        const faded =
          (selectedZ != null && !selected) ||
          (legendHighlight != null && !legendMatch) ||
          (effectiveAxisHover != null && !inAxisBand)
        const core = ZS_ELEMENT_CORE[el.z]
        const chi = core?.elektronegativita ?? null
        const ar = formatArForTile(core?.ar ?? '—')
        const latin = ELEMENT_LATIN_PAREN[el.z] ?? el.symbol
        const tileMarkers = tileMarkersFromCore(
          el.z,
          core?.stavPriStp ?? 'pevná',
        )

        cells.push(
          <div
            key={`${row}-${col}`}
            data-pt-element-z={el.z}
            className={[
              'pt-cell-slot',
              tileFamilyClass(el.category),
              groupRingClass(el.category, el.z),
              col === 1 ? 'pt-col-1' : '',
              col2CaRaClass(el.z, col),
              nonmetalCnopsClass(el.z, el.category),
              astatineTileClass(el.z),
              selected ? 'pt-cell-slot--selected' : '',
              faded ? 'pt-cell-slot--faded' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gridRow: row, gridColumn: col }}
          >
            <div className="pt-cell-underlay" aria-hidden />
            <button
              type="button"
              className={['pt-cell', selected ? 'pt-selected' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(el)}
              aria-pressed={selected}
              aria-label={`${el.nameCs}, ${el.symbol}, atomové číslo ${el.z}`}
            >
              <PtTileMarkers markers={tileMarkers} />
              <span
                className={chi ? 'pt-kin' : 'pt-kin pt-kin--na'}
                aria-hidden
              >
                {chi ?? '—'}
              </span>
              <div className="pt-symbol-block">
                {tileMarkers.bottomLeft ? (
                  tileMarkers.bottomLeft === 'umele' ? (
                    <>
                      <span className="pt-znum">{el.z}</span>
                      <span
                        className="pt-tile-marker pt-tile-marker--umele-corner"
                        title={PT_MARKER_TITLES.umele}
                      >
                        <PtMarkerSvg kind="umele" />
                      </span>
                    </>
                  ) : (
                    <div className="pt-znum-stack">
                      <span className="pt-znum">{el.z}</span>
                      <span
                        className="pt-tile-marker pt-tile-marker--under-z"
                        title={PT_MARKER_TITLES[tileMarkers.bottomLeft]}
                      >
                        <PtMarkerSvg kind={tileMarkers.bottomLeft} />
                      </span>
                    </div>
                  )
                ) : (
                  <span className="pt-znum">{el.z}</span>
                )}
                <span className="pt-sym">{el.symbol}</span>
              </div>
              <div className="pt-names">
                <span className="pt-name-cs">{el.nameCs}</span>
                <span className="pt-name-la">({latin})</span>
              </div>
              <span className="pt-ar">{ar}</span>
            </button>
          </div>,
        )
      } else {
        cells.push(
          <div
            key={`e-${row}-${col}`}
            className={[
              'pt-empty',
              selectedZ != null ||
              legendHighlight != null ||
              (effectiveAxisHover != null && !inAxisBand)
                ? 'pt-empty--faded'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gridRow: row, gridColumn: col }}
            aria-hidden
          />,
        )
      }
    }
  }

  const colHeads =
    layoutMode === 'expanded'
      ? Array.from({ length: gridCols }, (_, i) => {
          const gridCol = i + 1
          return {
            gridCol,
            label: expandedColumnHeaderLabel(gridCol),
          }
        })
      : Array.from({ length: gridCols }, (_, i) => ({
          gridCol: i + 1,
          label: String(i + 1),
        }))
  const rowHeads = Array.from({ length: gridRows }, (_, i) =>
    periodLabelForGridRow(i + 1, layoutMode),
  )

  const rootStyle: CSSProperties | undefined =
    selectedZ != null
      ? ({
          '--pt-selected-scale': String(selectedTileScale),
        } as CSSProperties)
      : undefined

  const navLayerStyle: CSSProperties | undefined =
    selectedZ != null && navCenter != null
      ? ({
          '--pt-nav-cx': `${navCenter.x}px`,
          '--pt-nav-cy': `${navCenter.y}px`,
        } as CSSProperties)
      : undefined

  return (
    <div
      className="periodic-table-root"
      data-pt-lod={lod}
      data-pt-layout={layoutMode}
      data-pt-dim-others={selectedZ != null ? '1' : undefined}
      style={rootStyle}
    >
      <div className="periodic-table-panel">
        <div
          className={[
            'periodic-table-grid-wrap',
            layoutMode === 'expanded' ? 'periodic-table-grid-wrap--expanded' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="pt-axis-frame">
            <div className="pt-axis-top-row">
              <div
                className="pt-col-labels"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, var(--pt-cell))`,
                }}
                onPointerLeave={(e) => {
                  const next = e.relatedTarget as Node | null
                  if (next && e.currentTarget.contains(next)) return
                  setAxisHover((h) => (h?.kind === 'col' ? null : h))
                }}
              >
                {colHeads.map(({ gridCol, label }) => (
                  <div
                    key={gridCol}
                    className={[
                      'pt-axis-tile',
                      'pt-axis-tile--col',
                      effectiveAxisHover?.kind === 'col' &&
                      effectiveAxisHover.index === gridCol
                        ? 'pt-axis-tile--band'
                        : '',
                      effectiveAxisHover != null &&
                      !(
                        effectiveAxisHover.kind === 'col' &&
                        effectiveAxisHover.index === gridCol
                      )
                        ? 'pt-axis-tile--dim'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onPointerEnter={() => {
                      if (selectedZ != null) return
                      setAxisHover({ kind: 'col', index: gridCol })
                    }}
                  >
                    <div className="pt-axis-tile__face">
                      {label != null ? (
                        <span className="pt-axis-num pt-axis-num--col">{label}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-axis-bottom-row">
              <div
                className="pt-row-labels"
                style={{
                  gridTemplateRows: `repeat(${gridRows}, var(--pt-cell))`,
                  rowGap: 'calc(var(--pt-gap) + var(--pt-under-shift))',
                }}
                onPointerLeave={(e) => {
                  const next = e.relatedTarget as Node | null
                  if (next && e.currentTarget.contains(next)) return
                  setAxisHover((h) => (h?.kind === 'row' ? null : h))
                }}
              >
                {rowHeads.map((label, i) => {
                  const gridRow = i + 1
                  return (
                    <div
                      key={`r-${i}-${label}`}
                      className={[
                        'pt-axis-tile',
                        'pt-axis-tile--row',
                        effectiveAxisHover?.kind === 'row' &&
                        effectiveAxisHover.index === gridRow
                          ? 'pt-axis-tile--band'
                          : '',
                        effectiveAxisHover != null &&
                        !(
                          effectiveAxisHover.kind === 'row' &&
                          effectiveAxisHover.index === gridRow
                        )
                          ? 'pt-axis-tile--dim'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onPointerEnter={() => {
                        if (selectedZ != null) return
                        setAxisHover({ kind: 'row', index: gridRow })
                      }}
                    >
                      <div className="pt-axis-tile__face">
                        <span className="pt-axis-num pt-axis-num--row">{label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pt-grid-core">
                <p className="pt-table-title">
                  <span className="pt-table-title__line">Periodická</span>
                  <span className="pt-table-title__line">tabulka prvků</span>
                </p>
                {layoutMode === 'compact' ? (
                  <FBlockCompactOverlays onExpand={onExpandLayout} />
                ) : (
                  <FBlockExpandedCompactNub onCompact={onCompactLayout} />
                )}
                <div className="pt-grid-and-nav">
                  <div
                    className="periodic-table-grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, var(--pt-cell))`,
                      gridTemplateRows: `repeat(${gridRows}, var(--pt-cell))`,
                    }}
                  >
                    {cells}
                  </div>
                  {selectedZ != null &&
                  !inspectorFullscreen &&
                  navCenter != null ? (
                    <nav
                      className="pt-element-nav-arrows"
                      style={navLayerStyle}
                      aria-label="Sousední prvek v tabulce"
                    >
                      <button
                        type="button"
                        className="pt-element-nav-arrow pt-element-nav-arrow--up"
                        disabled={navNeighbors.up == null}
                        onClick={() => onNavigate('up')}
                        aria-label="Vybrat prvek o řádek výš"
                        title="Řádek nahoru (↑)"
                      >
                        <svg
                          className="pt-element-nav-arrow-icon"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 7l5 5-5 5"
                            transform="rotate(-90 12 12)"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="pt-element-nav-arrow pt-element-nav-arrow--down"
                        disabled={navNeighbors.down == null}
                        onClick={() => onNavigate('down')}
                        aria-label="Vybrat prvek o řádek níž"
                        title="Řádek dolů (↓)"
                      >
                        <svg
                          className="pt-element-nav-arrow-icon"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 7l5 5-5 5"
                            transform="rotate(90 12 12)"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="pt-element-nav-arrow pt-element-nav-arrow--left"
                        disabled={navNeighbors.left == null}
                        onClick={() => onNavigate('left')}
                        aria-label="Vybrat prvek vlevo"
                        title="Sloupec vlevo (←)"
                      >
                        <svg
                          className="pt-element-nav-arrow-icon"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 7l-5 5 5 5"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="pt-element-nav-arrow pt-element-nav-arrow--right"
                        disabled={navNeighbors.right == null}
                        onClick={() => onNavigate('right')}
                        aria-label="Vybrat prvek vpravo"
                        title="Sloupec vpravo (→)"
                      >
                        <svg
                          className="pt-element-nav-arrow-icon"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 7l5 5-5 5"
                          />
                        </svg>
                      </button>
                    </nav>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {axisCaption ? (
        <div className="pt-axis-caption" role="status" aria-live="polite">
          {axisCaption}
        </div>
      ) : null}
    </div>
  )
}

export const PeriodicTable = memo(PeriodicTableInner)
