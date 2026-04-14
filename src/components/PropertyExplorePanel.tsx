import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  classificationButtonsForSubtype,
  type ClassificationSubtype,
} from '../data/classificationExplore'
import type {
  ExplorePropertyState,
  PropertyExploreKey,
} from '../data/exploreProperty'
import {
  defaultPropertyExploreState,
  PROPERTY_SCALE,
} from '../data/explorePropertyConfig'
import { CategoryLegendBar } from './CategoryLegendBar'
import './PropertyExplorePanel.css'

type Props = {
  state: ExplorePropertyState
  onChange: (next: ExplorePropertyState) => void
}

function selectValueFromState(s: ExplorePropertyState): string {
  if (s.kind === 'classification') return `c:${s.subtype}`
  return `p:${s.property}`
}

function parseSelectValue(v: string): ExplorePropertyState | null {
  if (v.startsWith('c:')) {
    const subtype = v.slice(2) as ClassificationSubtype
    return {
      kind: 'classification',
      subtype,
      clicked: null,
      hovered: null,
    }
  }
  if (v.startsWith('p:')) {
    const key = v.slice(2) as PropertyExploreKey
    if (!(key in PROPERTY_SCALE)) return null
    return defaultPropertyExploreState(key)
  }
  return null
}

type LegendScrollEdges = {
  overflow: boolean
  canLeft: boolean
  canRight: boolean
}

function ScrollableLegendStrip({
  children,
  measureDeps,
}: {
  children: ReactNode
  measureDeps: unknown
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const [edges, setEdges] = useState<LegendScrollEdges>({
    overflow: false,
    canLeft: false,
    canRight: false,
  })

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    const overflow = maxScroll > 2
    setEdges({
      overflow,
      canLeft: overflow && scrollLeft > 2,
      canRight: overflow && scrollLeft < maxScroll - 2,
    })
  }, [])

  useLayoutEffect(() => {
    syncEdges()
    const id = requestAnimationFrame(syncEdges)
    return () => cancelAnimationFrame(id)
  }, [syncEdges, measureDeps])

  useEffect(() => {
    const onResize = () => syncEdges()
    window.addEventListener('resize', onResize)
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => syncEdges())
    ro.observe(el)
    const inner = el.firstElementChild
    if (inner instanceof HTMLElement) ro.observe(inner)
    const t = window.setTimeout(syncEdges, 0)
    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [syncEdges, measureDeps])

  const scrollByDir = useCallback(
    (dir: -1 | 1) => {
      const el = scrollerRef.current
      if (!el) return
      const step = Math.max(100, Math.floor(el.clientWidth * 0.72))
      el.scrollBy({ left: dir * step, behavior: 'smooth' })
    },
    [],
  )

  return (
    <div className="app-prop-explore__legend-scroll">
      {edges.overflow && edges.canLeft ? (
        <button
          type="button"
          className="app-prop-explore__legend-scroll-btn"
          onClick={() => scrollByDir(-1)}
          aria-label="Posunout kategorie vlevo"
          title="Vlevo"
        >
          <svg
            className="app-prop-explore__legend-scroll-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 6l-6 6 6 6"
            />
          </svg>
        </button>
      ) : null}
      <div
        ref={scrollerRef}
        className="app-prop-explore__legend-wrap"
        onScroll={syncEdges}
      >
        {children}
      </div>
      {edges.overflow && edges.canRight ? (
        <button
          type="button"
          className="app-prop-explore__legend-scroll-btn"
          onClick={() => scrollByDir(1)}
          aria-label="Posunout kategorie vpravo"
          title="Vpravo"
        >
          <svg
            className="app-prop-explore__legend-scroll-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6l6 6-6 6"
            />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

export const PropertyExplorePanel = memo(function PropertyExplorePanel({
  state,
  onChange,
}: Props) {
  const selectValue = useMemo(() => selectValueFromState(state), [state])

  const onModeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = parseSelectValue(e.target.value)
      if (next) onChange(next)
    },
    [onChange],
  )

  const legendButtons = useMemo(() => {
    if (state.kind !== 'classification') return []
    return classificationButtonsForSubtype(state.subtype)
  }, [state])

  const legendToolbarLabel = useMemo(() => {
    if (state.kind !== 'classification') return ''
    switch (state.subtype) {
      case 'category':
        return 'Kategorie prvků'
      case 'block':
        return 'Blok (s, p, d, f)'
      case 'metal-type':
        return 'Typ kovu / nekovu'
      case 'state':
        return 'Skupenství při STP'
      default:
        return 'Klasifikace'
    }
  }, [state])

  const onLegendHover = useCallback(
    (key: string | null) => {
      if (state.kind !== 'classification') return
      onChange({ ...state, hovered: key })
    },
    [onChange, state],
  )

  const onLegendToggle = useCallback(
    (key: string) => {
      if (state.kind !== 'classification') return
      onChange({
        ...state,
        clicked: state.clicked === key ? null : key,
        hovered: null,
      })
    },
    [onChange, state],
  )

  const propMeta =
    state.kind === 'property' ? PROPERTY_SCALE[state.property] : null
  const pmin = propMeta?.min ?? 0
  const pmax = propMeta?.max ?? 1
  const pstep = propMeta?.step ?? 1

  const onLowInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state.kind !== 'property') return
      const nl = Math.max(pmin, Math.min(pmax, Number(e.target.value)))
      let nh = state.rangeMax
      if (nl > nh) nh = nl
      onChange({ ...state, rangeMin: nl, rangeMax: nh })
    },
    [onChange, state, pmin, pmax],
  )

  const onHighInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state.kind !== 'property') return
      const nh = Math.max(pmin, Math.min(pmax, Number(e.target.value)))
      let nl = state.rangeMin
      if (nh < nl) nl = nh
      onChange({ ...state, rangeMin: nl, rangeMax: nh })
    },
    [onChange, state, pmin, pmax],
  )

  const resetRange = useCallback(() => {
    if (state.kind !== 'property') return
    onChange(defaultPropertyExploreState(state.property))
  }, [onChange, state])

  const legendHighlighted =
    state.kind === 'classification'
      ? state.hovered ?? state.clicked
      : null
  const legendClicked = state.kind === 'classification' ? state.clicked : null

  return (
    <div
      className="app-prop-explore app-prop-explore--bar"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <label className="app-prop-explore__bar-label">
        <select
          className="app-prop-explore__select app-prop-explore__select--bar app-prop-explore__select--wide"
          value={selectValue}
          onChange={onModeChange}
          aria-label="Režim řazení a zobrazení vlastností"
        >
          <optgroup label="Klasifikace">
            <option value="c:category">Skupiny (kategorie)</option>
            <option value="c:block">Blok</option>
            <option value="c:metal-type">Typ kovu</option>
            <option value="c:state">Skupenství</option>
          </optgroup>
          <optgroup label="Vlastnosti">
            <option value="p:melting-point">Bod tání (°C)</option>
            <option value="p:boiling-point">Bod varu (°C)</option>
            <option value="p:density">Hustota (g/cm³)</option>
            <option value="p:electronegativity">Elektronegativita</option>
            <option value="p:ionization">1. ionizace (kJ/mol)</option>
            <option value="p:electron-affinity">Afinita elektronu (kJ/mol)</option>
            <option value="p:atomic-radius">Atomový poloměr (pm)</option>
            <option value="p:specific-heat">Měrná tep. kapacita (J/(g·°C))</option>
          </optgroup>
        </select>
      </label>

      {state.kind === 'classification' ? (
        <ScrollableLegendStrip
          measureDeps={`${state.subtype}-${legendButtons.length}`}
        >
          <CategoryLegendBar
            buttons={legendButtons}
            highlighted={legendHighlighted}
            clicked={legendClicked}
            onHover={onLegendHover}
            onToggle={onLegendToggle}
            ariaLabel={legendToolbarLabel}
          />
        </ScrollableLegendStrip>
      ) : null}

      {state.kind === 'property' && propMeta ? (
        <div
          className="app-prop-explore__mp-row"
          role="group"
          aria-label={`Rozsah: ${propMeta.label}`}
        >
          <span className="app-prop-explore__mp-bound" title="Dolní mez">
            {propMeta.formatBound(state.rangeMin)}
          </span>
          <div className="app-prop-explore__dual app-prop-explore__dual--bar">
            <div className="app-prop-explore__track" aria-hidden />
            <input
              type="range"
              className="app-prop-explore__range app-prop-explore__range--low"
              min={pmin}
              max={pmax}
              step={pstep}
              value={state.rangeMin}
              onChange={onLowInput}
              aria-label={`Dolní mez: ${propMeta.label}`}
            />
            <input
              type="range"
              className="app-prop-explore__range app-prop-explore__range--high"
              min={pmin}
              max={pmax}
              step={pstep}
              value={state.rangeMax}
              onChange={onHighInput}
              aria-label={`Horní mez: ${propMeta.label}`}
            />
          </div>
          <span className="app-prop-explore__mp-bound" title="Horní mez">
            {propMeta.formatBound(state.rangeMax)}
          </span>
          <button
            type="button"
            className="app-prop-explore__icon-btn"
            onClick={resetRange}
            aria-label="Resetovat rozsah"
            title="Reset rozsahu"
          >
            <svg
              className="app-prop-explore__icon-svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M23 4v6h-6M1 20v-6h6"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  )
})
