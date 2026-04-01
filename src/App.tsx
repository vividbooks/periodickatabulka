import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type PointerEvent,
  type RefObject,
} from 'react'
import { Atom2DModel } from './components/Atom2DModel'
import { VividbooksPanel } from './components/VividbooksPanel'
import { WikipediaImagesPanel } from './components/WikipediaImagesPanel'
import { CategoryLegendBar } from './components/CategoryLegendBar'
import { InfiniteCanvas } from './components/InfiniteCanvas'
import { PeriodicTable } from './components/PeriodicTable'
import {
  ELEMENTS,
  neighborElementInDirection,
  periodicTableOuterSizePxForLayout,
  type ChemicalElement,
  type GridNavDirection,
  type PeriodicTableLayoutMode,
} from './data/elements'
import type { LegendCategoryKey } from './data/legendCategories'
import { SHELL_ELECTRONS_BY_ATOMIC_NUMBER } from './data/shellsFromPeriodicTableJson'
import {
  formatShellsKlm,
  zsPraktickaPoznamka,
  zsValencePopis,
} from './data/zsChemNarativ'
import { vividbooksKnowledgeIdsForElement } from './data/vividbooksLessonsForElement'
import { ZS_ELEMENT_CORE } from './data/zsElementCore'
import { useWikipediaImagesForElement } from './hooks/useWikipediaImagesForElement'
import { useAtomStageViewport } from './hooks/useAtomStageViewport'
import {
  clamp,
  MAX_ZOOM,
  MIN_ZOOM,
  useInfiniteCanvas,
  type Camera,
} from './hooks/useInfiniteCanvas'
import './App.css'

/** Rozměr vnitřního „světa“ atomu ve fullscreen (musí sedět s fit v efektu). */
const INSPECTOR_ATOM_WORLD_PX = 720

type AtomCanvasPointerHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  | 'onPointerDownCapture'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onLostPointerCapture'
>

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const atomStageRef = useRef<HTMLDivElement>(null)
  const legendFooterScrollRef = useRef<HTMLDivElement>(null)
  const [legendFooterScroll, setLegendFooterScroll] = useState({
    overflow: false,
    canLeft: false,
    canRight: false,
  })
  /** Mobil: legenda skrytá za tlačítkem; po otevření pod sebou. */
  const [legendMenuOpen, setLegendMenuOpen] = useState(false)
  const [selectedZ, setSelectedZ] = useState<number | null>(null)
  const [inspectorFullscreen, setInspectorFullscreen] = useState(false)
  const [layoutMode, setLayoutMode] =
    useState<PeriodicTableLayoutMode>('compact')
  const [legendClicked, setLegendClicked] = useState<LegendCategoryKey | null>(
    null,
  )
  const [legendHovered, setLegendHovered] = useState<LegendCategoryKey | null>(
    null,
  )
  const legendHighlight = legendHovered ?? legendClicked

  const {
    camera,
    setCamera,
    applyWheelZoom,
    applyTrackpadPan,
    viewportHandlers: {
      onPointerDownCapture: canvasPointerDownCapture,
      onPointerMove: canvasPointerMove,
      onPointerUp: canvasPointerUp,
      onPointerCancel: canvasPointerCancel,
      onLostPointerCapture: canvasLostPointerCapture,
    },
  } = useInfiniteCanvas({ x: 0, y: 0, zoom: 1 }, viewportRef)

  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const sync = () => {
      setViewportSize({ w: el.clientWidth, h: el.clientHeight })
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleSelectElement = useCallback((el: ChemicalElement | null) => {
    setSelectedZ(el?.z ?? null)
    if (
      el != null &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 720px)').matches
    ) {
      setInspectorFullscreen(true)
    }
  }, [])

  const handleExpandLayout = useCallback(() => {
    setLayoutMode('expanded')
  }, [])

  const handleCompactLayout = useCallback(() => {
    setLayoutMode('compact')
  }, [])

  const handleLegendHover = useCallback((key: LegendCategoryKey | null) => {
    setLegendHovered(key)
  }, [])

  const handleLegendToggle = useCallback((key: LegendCategoryKey) => {
    setLegendClicked((current) => (current === key ? null : key))
  }, [])

  const handleCanvasPointerDownCapture = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      canvasPointerDownCapture(e)
      const t = e.target as HTMLElement
      if (t.closest('button.pt-cell')) return
      if (t.closest('.pt-fblock-expand-nub')) return
      if (t.closest('.pt-element-nav-arrows')) return
      if (selectedZ != null) setSelectedZ(null)
      if (legendClicked != null) setLegendClicked(null)
    },
    [canvasPointerDownCapture, selectedZ, legendClicked],
  )

  const handleInspectorClose = useCallback(() => {
    setInspectorFullscreen(false)
    setSelectedZ(null)
  }, [])

  const handleToggleInspectorFullscreen = useCallback(() => {
    setInspectorFullscreen((open) => !open)
  }, [])

  const cameraRef = useRef(camera)

  const {
    camera: atomCamera,
    setCamera: setAtomCamera,
    applyWheelZoom: applyAtomWheelZoom,
    applyTrackpadPan: applyAtomTrackpadPan,
    viewportHandlers: atomViewportHandlers,
  } = useAtomStageViewport(atomStageRef, INSPECTOR_ATOM_WORLD_PX)

  const atomCanvasHandlers = useMemo<AtomCanvasPointerHandlers>(
    () => ({ ...atomViewportHandlers }),
    [atomViewportHandlers],
  )

  const selected = useMemo(
    () =>
      selectedZ == null
        ? null
        : (ELEMENTS.find((e) => e.z === selectedZ) ?? null),
    [selectedZ],
  )

  const navigateSelect = useCallback(
    (dir: GridNavDirection) => {
      if (selectedZ == null) return
      const next = neighborElementInDirection(selectedZ, layoutMode, dir)
      if (next) handleSelectElement(next)
    },
    [selectedZ, layoutMode, handleSelectElement],
  )

  useLayoutEffect(() => {
    cameraRef.current = camera
  }, [camera])

  const layoutModeForFitRef = useRef(layoutMode)
  const didInitialFitRef = useRef(false)

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return

    let lastW = -1
    let lastH = -1

    const layoutModeChanged = layoutModeForFitRef.current !== layoutMode
    layoutModeForFitRef.current = layoutMode
    let forceFullFit = layoutModeChanged

    const fit = () => {
      const vw = el.clientWidth
      const vh = el.clientHeight
      if (vw < 16 || vh < 16) return
      if (vw === lastW && vh === lastH) return
      lastW = vw
      lastH = vh

      if (!didInitialFitRef.current || forceFullFit) {
        didInitialFitRef.current = true
        forceFullFit = false
        const { width: tw, height: th } =
          periodicTableOuterSizePxForLayout(layoutModeForFitRef.current)
        const z = Math.min(vw / tw, vh / th) * 0.92
        setCamera({
          x: (vw - tw * z) / 2,
          y: (vh - th * z) / 2,
          zoom: z,
        })
        return
      }

      /* Změna šířky (panel, okno): nesahej na kameru — přecentrování dělalo „poskočení“. */
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [setCamera, layoutMode])

  useEffect(() => {
    /* Bez fullscreen resetu by zůstalo true po zavření výběru mimo „Zavřít“. */
    if (selectedZ == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizace odvozeného UI stavu
      setInspectorFullscreen(false)
    }
  }, [selectedZ])

  const isMobileViewport = viewportSize.w > 0 && viewportSize.w <= 720
  const legendPanelOpen = !isMobileViewport || legendMenuOpen

  useEffect(() => {
    if (!isMobileViewport) setLegendMenuOpen(false)
  }, [isMobileViewport])

  useEffect(() => {
    if (selectedZ != null) setLegendMenuOpen(false)
  }, [selectedZ])

  /**
   * Posun kamery podle skutečné pozice buňky vůči plátnu (getBoundingClientRect).
   * Teoretické souřadnice z elements.ts nestačily po fixed inspektoru + paddingu.
   */
  useLayoutEffect(() => {
    if (selectedZ == null || inspectorFullscreen) return

    const applyPanFromDom = () => {
      const vp = viewportRef.current
      if (!vp) return
      const slot = vp.querySelector<HTMLElement>(
        `[data-pt-element-z="${String(selectedZ)}"]`,
      )
      if (!slot) return

      const vr = vp.getBoundingClientRect()
      const cr = slot.getBoundingClientRect()
      const margin = 36
      let dx = 0
      let dy = 0
      if (cr.right > vr.right - margin) dx += vr.right - margin - cr.right
      if (cr.left + dx < vr.left + margin) dx += vr.left + margin - (cr.left + dx)
      if (cr.bottom > vr.bottom - margin) dy += vr.bottom - margin - cr.bottom
      if (cr.top + dy < vr.top + margin) dy += vr.top + margin - (cr.top + dy)

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return

      const prev = cameraRef.current
      setCamera({ ...prev, x: prev.x + dx, y: prev.y + dy })
    }

    applyPanFromDom()
    const id = requestAnimationFrame(applyPanFromDom)
    const t = window.setTimeout(applyPanFromDom, 0)

    const vp = viewportRef.current
    const ro = new ResizeObserver(applyPanFromDom)
    if (vp) ro.observe(vp)

    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(t)
      ro.disconnect()
    }
  }, [selectedZ, layoutMode, inspectorFullscreen, setCamera])

  useLayoutEffect(() => {
    if (!inspectorFullscreen || selectedZ == null) return
    const el = atomStageRef.current
    if (!el) return

    const fitAtom = () => {
      const vw = el.clientWidth
      const vh = el.clientHeight
      if (vw < 16 || vh < 16) return
      const z =
        Math.min(vw / INSPECTOR_ATOM_WORLD_PX, vh / INSPECTOR_ATOM_WORLD_PX) *
        0.9
      setAtomCamera({
        x: (vw - INSPECTOR_ATOM_WORLD_PX * z) / 2,
        y: (vh - INSPECTOR_ATOM_WORLD_PX * z) / 2,
        zoom: z,
      })
    }

    fitAtom()
    const ro = new ResizeObserver(fitAtom)
    ro.observe(el)
    return () => ro.disconnect()
  }, [inspectorFullscreen, selectedZ, setAtomCamera])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        if (inspectorFullscreen) setInspectorFullscreen(false)
        else if (selectedZ != null) setSelectedZ(null)
        else if (legendClicked != null) setLegendClicked(null)
        return
      }
      if (selectedZ == null) return
      const dirMap: Partial<Record<string, GridNavDirection>> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }
      const dir = dirMap[e.code]
      if (!dir) return
      const el = e.target as HTMLElement | null
      if (
        el?.closest('input, textarea, select, [contenteditable="true"]') ||
        el?.isContentEditable
      )
        return
      const next = neighborElementInDirection(selectedZ, layoutMode, dir)
      if (!next) return
      e.preventDefault()
      handleSelectElement(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    selectedZ,
    inspectorFullscreen,
    legendClicked,
    layoutMode,
    handleSelectElement,
  ])

  useEffect(() => {
    const v = viewportRef.current
    if (!v) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target === v && e.code === 'Space') e.preventDefault()
    }
    v.addEventListener('keydown', onKey)
    return () => v.removeEventListener('keydown', onKey)
  }, [])

  const applyZoomAtCenter = useCallback(
    (nextZ: number) => {
      const z = clamp(nextZ, MIN_ZOOM, MAX_ZOOM)
      const el = viewportRef.current
      const prev = cameraRef.current
      if (!el) {
        setCamera({ ...prev, zoom: z })
        return
      }
      const cx = el.clientWidth / 2
      const cy = el.clientHeight / 2
      const prevZ = prev.zoom
      const wx = (cx - prev.x) / prevZ
      const wy = (cy - prev.y) / prevZ
      setCamera({
        zoom: z,
        x: cx - wx * z,
        y: cy - wy * z,
      })
    },
    [setCamera],
  )

  const handleZoomSliderChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      applyZoomAtCenter(Number(e.target.value))
    },
    [applyZoomAtCenter],
  )

  const handleZoomStepOut = useCallback(() => {
    applyZoomAtCenter(cameraRef.current.zoom / 1.12)
  }, [applyZoomAtCenter])

  const handleZoomStepIn = useCallback(() => {
    applyZoomAtCenter(cameraRef.current.zoom * 1.12)
  }, [applyZoomAtCenter])

  /** Stejný výpočet jako při počátečním „fit“ — celá tabulka vycentrovaná v plátně. */
  const handleResetTableView = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (vw < 16 || vh < 16) return
    const { width: tw, height: th } =
      periodicTableOuterSizePxForLayout(layoutMode)
    const z = Math.min(vw / tw, vh / th) * 0.92
    setCamera({
      x: (vw - tw * z) / 2,
      y: (vh - th * z) / 2,
      zoom: z,
    })
  }, [layoutMode, setCamera])

  const updateLegendFooterScrollHints = useCallback(() => {
    const el = legendFooterScrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = Math.max(0, scrollWidth - clientWidth)
    const overflow = maxScroll > 2
    setLegendFooterScroll({
      overflow,
      canLeft: overflow && scrollLeft > 2,
      canRight: overflow && scrollLeft < maxScroll - 2,
    })
  }, [])

  useLayoutEffect(() => {
    const el = legendFooterScrollRef.current
    if (!el) return
    const inner = el.firstElementChild as HTMLElement | null
    const ro = new ResizeObserver(() => {
      updateLegendFooterScrollHints()
    })
    ro.observe(el)
    if (inner) ro.observe(inner)
    el.addEventListener('scroll', updateLegendFooterScrollHints, { passive: true })
    updateLegendFooterScrollHints()
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', updateLegendFooterScrollHints)
    }
  }, [updateLegendFooterScrollHints, camera.zoom, layoutMode, selectedZ])

  const scrollLegendFooter = useCallback(
    (dir: -1 | 1) => {
      const el = legendFooterScrollRef.current
      if (!el) return
      const w = el.clientWidth
      el.scrollBy({
        left: dir * Math.max(100, Math.floor(w * 0.65)),
        behavior: 'smooth',
      })
    },
    [],
  )

  return (
    <div className="app-shell">
      <div
        className={[
          'app-body',
          selected && !inspectorFullscreen ? 'app-body--detail-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className={[
            'app-canvas-wrap',
            selected && !inspectorFullscreen ? 'app-canvas-wrap--inspector' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <InfiniteCanvas
            ref={viewportRef}
            className={selected ? 'infinite-canvas-viewport--element-detail' : ''}
            camera={camera}
            applyWheelZoom={applyWheelZoom}
            applyTrackpadPan={applyTrackpadPan}
            onPointerDownCapture={handleCanvasPointerDownCapture}
            onPointerMove={canvasPointerMove}
            onPointerUp={canvasPointerUp}
            onPointerCancel={canvasPointerCancel}
            onLostPointerCapture={canvasLostPointerCapture}
          >
            <PeriodicTable
              zoom={camera.zoom}
              layoutMode={layoutMode}
              selectedZ={selectedZ}
              onSelect={handleSelectElement}
              onExpandLayout={handleExpandLayout}
              onCompactLayout={handleCompactLayout}
              legendHighlight={legendHighlight}
              viewportWidth={viewportSize.w}
              viewportHeight={viewportSize.h}
              onNavigate={navigateSelect}
              inspectorFullscreen={inspectorFullscreen}
            />
          </InfiniteCanvas>
        </div>
      </div>

      {selected ? (
        <aside
          className={[
            'app-inspector',
            inspectorFullscreen ? 'app-inspector--fullscreen' : '',
            inspectorFullscreen && isMobileViewport
              ? 'app-inspector--mobile-cover'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live="polite"
        >
          <ZsInspectorPanel
            element={selected}
            atomWorldPx={INSPECTOR_ATOM_WORLD_PX}
            onClose={handleInspectorClose}
            fullscreen={inspectorFullscreen}
            onToggleFullscreen={handleToggleInspectorFullscreen}
            atomCanvasRef={atomStageRef}
            atomCamera={atomCamera}
            setAtomCamera={setAtomCamera}
            atomApplyWheelZoom={applyAtomWheelZoom}
            atomApplyTrackpadPan={applyAtomTrackpadPan}
            atomCanvasPointerHandlers={atomCanvasHandlers}
          />
        </aside>
      ) : null}

      <div
        className={[
          'app-legend-footer',
          selected && !inspectorFullscreen ? 'app-legend-footer--dimmed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="app-zoom-control" role="group" aria-label="Přiblížení tabulky">
          <button
            type="button"
            className="app-zoom-btn app-zoom-btn--reset"
            onClick={handleResetTableView}
            aria-label="Celá tabulka — resetovat zoom a pozici"
            title="Celá tabulka"
          >
            <svg
              className="app-zoom-btn-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
            >
              <path
                d="M4 9V4h5M15 4h5v5M4 15v5h5M19 15v5h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9h6v6H9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="app-zoom-btn"
            onClick={handleZoomStepOut}
            aria-label="Oddálit"
            title="Oddálit"
          >
            <svg
              className="app-zoom-btn-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
            >
              <circle
                cx="10"
                cy="10"
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M14.5 14.5L20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7 10h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <input
            id="app-zoom-slider"
            className="app-zoom-slider"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={camera.zoom}
            onChange={handleZoomSliderChange}
            aria-valuemin={MIN_ZOOM}
            aria-valuemax={MAX_ZOOM}
            aria-valuenow={camera.zoom}
            aria-label="Úroveň přiblížení"
          />
          <button
            type="button"
            className="app-zoom-btn"
            onClick={handleZoomStepIn}
            aria-label="Přiblížit"
            title="Přiblížit"
          >
            <svg
              className="app-zoom-btn-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
            >
              <circle
                cx="10"
                cy="10"
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M14.5 14.5L20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7 10h6M10 7v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="app-legend-hamburger"
            aria-expanded={legendMenuOpen}
            aria-controls="app-legend-footer-panel"
            id="app-legend-menu-toggle"
            onClick={() => setLegendMenuOpen((o) => !o)}
            aria-label={
              legendMenuOpen
                ? 'Skrýt skupiny prvků'
                : 'Skupiny prvků — zobrazit'
            }
            title="Skupiny prvků"
          >
            <svg
              className="app-legend-hamburger-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div
          className={[
            'app-legend-footer-panel',
            legendPanelOpen ? 'app-legend-footer-panel--open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          id="app-legend-footer-panel"
          role="region"
          aria-labelledby="app-legend-menu-toggle"
          hidden={!legendPanelOpen}
        >
        <button
          type="button"
          className={[
            'app-legend-scroll-btn',
            legendFooterScroll.overflow ? '' : 'app-legend-scroll-btn--hidden',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => scrollLegendFooter(-1)}
          disabled={!legendFooterScroll.overflow || !legendFooterScroll.canLeft}
          tabIndex={legendFooterScroll.overflow ? 0 : -1}
          aria-hidden={!legendFooterScroll.overflow}
          aria-label="Posunout legendu vlevo"
          title="Posunout legendu vlevo"
        >
          <svg
            className="app-legend-scroll-btn-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden
          >
            <path
              d="M14 7l-5 5 5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className="app-legend-footer-scroll"
          ref={legendFooterScrollRef}
        >
          <CategoryLegendBar
            highlighted={legendHighlight}
            clicked={legendClicked}
            onHover={handleLegendHover}
            onToggle={handleLegendToggle}
          />
        </div>
        <button
          type="button"
          className={[
            'app-legend-scroll-btn',
            legendFooterScroll.overflow ? '' : 'app-legend-scroll-btn--hidden',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => scrollLegendFooter(1)}
          disabled={!legendFooterScroll.overflow || !legendFooterScroll.canRight}
          tabIndex={legendFooterScroll.overflow ? 0 : -1}
          aria-hidden={!legendFooterScroll.overflow}
          aria-label="Posunout legendu doprava"
          title="Posunout legendu doprava"
        >
          <svg
            className="app-legend-scroll-btn-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden
          >
            <path
              d="M10 7l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        </div>
      </div>
    </div>
  )
}

type InspectorTab = 'basics' | 'vividbooks' | 'images'

const ZsInspectorPanel = memo(function ZsInspectorPanel({
  element,
  onClose,
  fullscreen,
  onToggleFullscreen,
  atomCanvasRef,
  atomCamera,
  setAtomCamera,
  atomApplyWheelZoom,
  atomApplyTrackpadPan,
  atomCanvasPointerHandlers,
  atomWorldPx,
}: {
  element: ChemicalElement
  onClose: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
  atomCanvasRef: RefObject<HTMLDivElement | null>
  atomCamera: Camera
  setAtomCamera: (next: Camera) => void
  atomApplyWheelZoom: (sx: number, sy: number, deltaY: number) => void
  atomApplyTrackpadPan: (dx: number, dy: number) => void
  atomCanvasPointerHandlers: AtomCanvasPointerHandlers
  atomWorldPx: number
}) {
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('basics')
  const [atomSpinPaused, setAtomSpinPaused] = useState(false)

  useEffect(() => {
    setInspectorTab('basics')
  }, [element.z])

  useEffect(() => {
    setAtomSpinPaused(false)
  }, [element.z])

  const applyAtomZoomAtCenter = useCallback(
    (nextZoom: number) => {
      const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      const el = atomCanvasRef.current
      if (!el) return
      const vw = el.clientWidth
      const vh = el.clientHeight
      const c = atomWorldPx / 2
      setAtomCamera({
        zoom: z,
        x: vw / 2 - c * z,
        y: vh / 2 - c * z,
      })
    },
    [atomCanvasRef, atomWorldPx, setAtomCamera],
  )

  const handleAtomZoomSlider = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      applyAtomZoomAtCenter(Number(e.target.value))
    },
    [applyAtomZoomAtCenter],
  )

  const handleAtomZoomStepOut = useCallback(() => {
    applyAtomZoomAtCenter(atomCamera.zoom / 1.12)
  }, [applyAtomZoomAtCenter, atomCamera.zoom])

  const handleAtomZoomStepIn = useCallback(() => {
    applyAtomZoomAtCenter(atomCamera.zoom * 1.12)
  }, [applyAtomZoomAtCenter, atomCamera.zoom])

  const showVividbooksTab = useMemo(
    () => vividbooksKnowledgeIdsForElement(element).length > 0,
    [element],
  )

  const wiki = useWikipediaImagesForElement(element)
  const showWikiTab =
    !wiki.loading && wiki.error == null && wiki.items.length > 0
  const showTabBar = showVividbooksTab || showWikiTab

  useEffect(() => {
    if (inspectorTab === 'vividbooks' && !showVividbooksTab) {
      setInspectorTab('basics')
    }
  }, [inspectorTab, showVividbooksTab])

  useEffect(() => {
    if (inspectorTab === 'images' && !showWikiTab) {
      setInspectorTab('basics')
    }
  }, [inspectorTab, showWikiTab])

  const core = ZS_ELEMENT_CORE[element.z]
  const shells = SHELL_ELECTRONS_BY_ATOMIC_NUMBER[element.z]
  const hasData = Boolean(core && shells)

  const headerActions = (
    <div className="inspector-header-actions">
      {hasData ? (
        <button
          type="button"
          className="inspector-fs"
          onClick={onToggleFullscreen}
          aria-pressed={fullscreen}
          aria-label={
            fullscreen ? 'Zpět do postranního panelu' : 'Celá obrazovka'
          }
          title={fullscreen ? 'Zmenšit' : 'Na celou obrazovku'}
        >
          <svg
            className="inspector-fs-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden
          >
            {fullscreen ? (
              <path
                fill="currentColor"
                d="M8 3v3H5v2h5V3H8zm6 0v5h5V6h-3V3h-2zm-9 9v2h3v3h2v-5H5zm13 3v3h-3v2h5v-5h-2z"
              />
            ) : (
              <path
                fill="currentColor"
                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              />
            )}
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        className="inspector-close-x"
        onClick={onClose}
        aria-label="Zavřít panel"
      >
        ×
      </button>
    </div>
  )

  const sidebarHeader = (
    <header className="inspector-header">
      <div className="inspector-header-main">
        <div className="inspector-header-titles">
          <h2 className="inspector-title">{element.symbol}</h2>
          <p className="inspector-name">{element.nameCs}</p>
        </div>
      </div>
      {headerActions}
    </header>
  )

  const fullscreenRightHead = (
    <div className="inspector-fullscreen-righthead">
      <div className="inspector-fullscreen-righthead-main">
        <div className="inspector-header-titles">
          <h2 className="inspector-title">{element.symbol}</h2>
          <p className="inspector-name">{element.nameCs}</p>
        </div>
      </div>
      {headerActions}
    </div>
  )

  const detailsBody = useMemo(() => {
    const c = ZS_ELEMENT_CORE[element.z]
    const sh = SHELL_ELECTRONS_BY_ATOMIC_NUMBER[element.z]
    if (!c || !sh) return null
    const en = c.elektronegativita
    const rho = c.hustota
    return (
      <>
        <h3 className="inspector-section-title inspector-section-title--compact">
          Údaje pro ZŠ
        </h3>
        <dl className="inspector-dl inspector-dl--compact">
          <div className="inspector-info-block">
            <dt>Protonové číslo Z</dt>
            <dd>{element.z} (v neutrálním atomu stejně e⁻)</dd>
          </div>
          <div className="inspector-info-block">
            <dt>Relativní atomová hmotnost Ar</dt>
            <dd>{c.ar}</dd>
          </div>
          <div className="inspector-info-block">
            <dt>Perioda (řada tabulky)</dt>
            <dd>{c.perioda}</dd>
          </div>
          <div className="inspector-info-block">
            <dt>Skupina (IUPAC 1–18)</dt>
            <dd>
              {c.skupina == null ? '—' : c.skupina}
              <span className="inspector-sub"> · {c.skupinaPopis}</span>
            </dd>
          </div>
          <div className="inspector-info-block">
            <dt>Stav při běžné teplotě</dt>
            <dd className="inspector-dd-cap">{c.stavPriStp}</dd>
          </div>
          <div className="inspector-info-block">
            <dt>Zařazení (kov / nekov …)</dt>
            <dd>{c.typLatkyZs}</dd>
          </div>
          <div className="inspector-info-block inspector-info-block--full">
            <dt>Obsazení slupek (K, L, M …)</dt>
            <dd className="inspector-dd-mono">{formatShellsKlm(sh)}</dd>
          </div>
          <div className="inspector-info-block inspector-info-block--full">
            <dt>Valenční elektrony (slovní výklad)</dt>
            <dd>{zsValencePopis(element.z, c)}</dd>
          </div>
          <div className="inspector-info-block">
            <dt>
              Elektronegativita <span className="inspector-dt-sub">χ (Pauling)</span>
            </dt>
            <dd>{en ?? '— (v některých tabulkách chybí)'}</dd>
          </div>
          <div className="inspector-info-block">
            <dt>Hustota</dt>
            <dd>
              {rho == null
                ? '— (u plynů často neuvádíme jako u pevných látek)'
                : `${rho} g·cm⁻³`}
            </dd>
          </div>
        </dl>

        <p className="inspector-zs-tip inspector-info-block inspector-info-block--full">
          {zsPraktickaPoznamka(c)}
        </p>
      </>
    )
  }, [element])

  const basicsPanel =
    hasData && detailsBody ? (
      detailsBody
    ) : (
      <p className="inspector-empty">
        Pro tento prvek chybí rozšířená data pro ZŠ.
      </p>
    )

  const tabPanelAriaLabelledBy =
    inspectorTab === 'basics'
      ? 'inspector-tab-basics'
      : inspectorTab === 'vividbooks'
        ? 'inspector-tab-vividbooks'
        : 'inspector-tab-images'

  const inspectorTabsSection = showTabBar ? (
    <>
      <div className="inspector-tabs" role="tablist" aria-label="Sekce detailu prvku">
        <button
          type="button"
          className={[
            'inspector-tabs__btn',
            inspectorTab === 'basics' ? 'inspector-tabs__btn--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="tab"
          aria-selected={inspectorTab === 'basics'}
          id="inspector-tab-basics"
          onClick={() => setInspectorTab('basics')}
        >
          Základní vlastnosti
        </button>
        {showVividbooksTab ? (
          <button
            type="button"
            className={[
              'inspector-tabs__btn',
              inspectorTab === 'vividbooks' ? 'inspector-tabs__btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="tab"
            aria-selected={inspectorTab === 'vividbooks'}
            id="inspector-tab-vividbooks"
            onClick={() => setInspectorTab('vividbooks')}
          >
            Vividbooks lekce
          </button>
        ) : null}
        {showWikiTab ? (
          <button
            type="button"
            className={[
              'inspector-tabs__btn',
              inspectorTab === 'images' ? 'inspector-tabs__btn--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="tab"
            aria-selected={inspectorTab === 'images'}
            id="inspector-tab-images"
            onClick={() => setInspectorTab('images')}
          >
            Obrázky
          </button>
        ) : null}
      </div>
      <div
        className="inspector-tab-panel"
        role="tabpanel"
        aria-labelledby={tabPanelAriaLabelledBy}
      >
        {inspectorTab === 'basics' && basicsPanel}
        {inspectorTab === 'vividbooks' && showVividbooksTab ? (
          <VividbooksPanel element={element} />
        ) : null}
        {inspectorTab === 'images' && showWikiTab ? (
          <WikipediaImagesPanel items={wiki.items} />
        ) : null}
      </div>
    </>
  ) : (
    basicsPanel
  )

  if (fullscreen) {
    return (
      <div className="inspector-fullscreen-split">
        <div className="inspector-fullscreen-atom">
          <div className="inspector-fullscreen-atom-canvas-wrap">
            <InfiniteCanvas
              ref={atomCanvasRef}
              className="inspector-atom-canvas"
              camera={atomCamera}
              applyWheelZoom={atomApplyWheelZoom}
              applyTrackpadPan={atomApplyTrackpadPan}
              ariaLabel="Model atomu. Kolečko mění měřítko ke středu; ovládání je dole uprostřed."
              {...atomCanvasPointerHandlers}
            >
              <div
                className="inspector-atom-world"
                style={{ width: atomWorldPx, height: atomWorldPx }}
              >
                <Atom2DModel
                  element={element}
                  layout="stage"
                  spinPaused={atomSpinPaused}
                  onSpinPausedChange={setAtomSpinPaused}
                />
              </div>
            </InfiniteCanvas>
            <div
              className="inspector-atom-toolbar"
              role="toolbar"
              aria-label="Zoom a přehrávání modelu atomu"
            >
              <button
                type="button"
                className="app-zoom-btn"
                onClick={() => setAtomSpinPaused((p) => !p)}
                aria-pressed={atomSpinPaused}
                aria-label={
                  atomSpinPaused ? 'Spustit otáčení obalů' : 'Pozastavit otáčení obalů'
                }
                title={atomSpinPaused ? 'Přehrát' : 'Pauza'}
              >
                <span className="inspector-atom-play-icon" aria-hidden>
                  {atomSpinPaused ? '▶' : '⏸'}
                </span>
              </button>
              <button
                type="button"
                className="app-zoom-btn"
                onClick={handleAtomZoomStepOut}
                aria-label="Oddálit model atomu"
                title="Oddálit"
              >
                <svg
                  className="app-zoom-btn-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M14.5 14.5L20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 10h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <input
                id="inspector-atom-zoom"
                className="app-zoom-slider inspector-atom-zoom-slider"
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={atomCamera.zoom}
                onChange={handleAtomZoomSlider}
                aria-valuemin={MIN_ZOOM}
                aria-valuemax={MAX_ZOOM}
                aria-valuenow={atomCamera.zoom}
                aria-label="Přiblížení modelu atomu"
              />
              <button
                type="button"
                className="app-zoom-btn"
                onClick={handleAtomZoomStepIn}
                aria-label="Přiblížit model atomu"
                title="Přiblížit"
              >
                <svg
                  className="app-zoom-btn-icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M14.5 14.5L20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 10h6M10 7v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="inspector-fullscreen-info">
          {fullscreenRightHead}
          {inspectorTabsSection}
        </div>
      </div>
    )
  }

  return (
    <>
      {sidebarHeader}
      <Atom2DModel element={element} />
      {inspectorTabsSection}
    </>
  )
})
