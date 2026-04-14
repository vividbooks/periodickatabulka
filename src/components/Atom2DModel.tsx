import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChemicalElement } from '../data/elements'
import {
  atomModelPaletteForElement,
  type AtomModelPalette,
} from '../data/atomModelColors'
import { getAtomShellData } from '../data/shellsFromPeriodicTableJson'
import './Atom2DModel.css'

const ORBIT_BASE = 30
const ORBIT_STEP = 26
const ELECTRON_R = 5
/** Minimální okraj viewBoxu kolem vnější vrstvy (px v SVG prostoru) — menší = větší atom v kruhu. */
const VB_PAD = 10

const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'] as const

function protonsLabelCs(z: number): string {
  if (z === 1) return '1 proton'
  if (z >= 2 && z <= 4) return `${z} protony`
  return `${z} protonů`
}

function neutronsLabelCs(n: number): string {
  if (n === 0) return '0 neutronů'
  if (n === 1) return '1 neutron'
  if (n >= 2 && n <= 4) return `${n} neutrony`
  return `${n} neutronů`
}

function electronsLabelCs(n: number): string {
  if (n === 1) return '1 elektron'
  if (n >= 2 && n <= 4) return `${n} elektrony`
  return `${n} elektronů`
}

type Props = {
  element: ChemicalElement
  /** sidebar = kolečko v panelu; stage = větší v plátně s zoomem */
  layout?: 'sidebar' | 'stage'
  /**
   * Řízení pauzy otáčení zvenku (fullscreen panel) — pokud je `onSpinPausedChange`,
   * klik na SVG přepínání vypne a stav drží rodič.
   */
  spinPaused?: boolean
  onSpinPausedChange?: (paused: boolean) => void
}

const STAGE_NUCLEUS_SCALE = 0.44
const NUCLEUS_ROT_PERIOD_SEC = 22
const COAST_DECAY_PER_S = 3.35
const COAST_MIN_MS = 320
const COAST_MAX_MS = 1200
const COAST_VEL_EPS = 0.72

type ShellSpinConfig = { durationSec: number; reverse: boolean }

function useSoftAtomSpin(
  elementZ: number,
  userPaused: boolean,
  reduceMotion: boolean,
  shellConfigs: ShellSpinConfig[],
): { nucleusDeg: number; shellDegs: number[] } {
  const nucleusCumRef = useRef(0)
  const shellCumsRef = useRef<number[]>([])
  const nucleusVelRef = useRef(0)
  const shellVelsRef = useRef<number[]>([])
  const modeRef = useRef<'run' | 'coast' | 'still'>('run')
  const lastTRef = useRef<number | null>(null)
  const coastStartRef = useRef<number | null>(null)
  const prevPausedRef = useRef(userPaused)
  const userPausedRef = useRef(userPaused)
  const reduceMotionRef = useRef(reduceMotion)
  const shellConfigsRef = useRef(shellConfigs)
  userPausedRef.current = userPaused
  reduceMotionRef.current = reduceMotion
  shellConfigsRef.current = shellConfigs

  const [out, setOut] = useState({ nucleusDeg: 0, shellDegs: [] as number[] })

  useEffect(() => {
    nucleusCumRef.current = 0
    nucleusVelRef.current = 0
    const cfgs = shellConfigsRef.current
    shellCumsRef.current = cfgs.map(() => 0)
    shellVelsRef.current = cfgs.map(() => 0)
    modeRef.current = userPausedRef.current ? 'still' : 'run'
    lastTRef.current = null
    coastStartRef.current = null
    prevPausedRef.current = userPausedRef.current
    setOut({
      nucleusDeg: 0,
      shellDegs: cfgs.map(() => 0),
    })
  }, [elementZ])

  useEffect(() => {
    let id = 0
    const NS = 360 / NUCLEUS_ROT_PERIOD_SEC
    const norm = (a: number) => ((a % 360) + 360) % 360

    const ensureShellLen = (n: number) => {
      if (shellCumsRef.current.length !== n) {
        shellCumsRef.current = Array.from({ length: n }, () => 0)
        shellVelsRef.current = Array.from({ length: n }, () => 0)
      }
    }

    const step = (now: number) => {
      const userPaused = userPausedRef.current
      const reduceMotion = reduceMotionRef.current
      const shellConfigs = shellConfigsRef.current
      ensureShellLen(shellConfigs.length)

      const last = lastTRef.current
      lastTRef.current = now
      const dt =
        last == null ? 0 : Math.min(0.055, Math.max(0, (now - last) / 1000))

      if (reduceMotion) {
        nucleusCumRef.current = 0
        shellCumsRef.current = shellConfigs.map(() => 0)
        modeRef.current = 'still'
        prevPausedRef.current = userPaused
        setOut({
          nucleusDeg: 0,
          shellDegs: shellConfigs.map(() => 0),
        })
        id = requestAnimationFrame(step)
        return
      }

      const prev = prevPausedRef.current
      if (userPaused && !prev) {
        if (modeRef.current === 'run') {
          modeRef.current = 'coast'
          nucleusVelRef.current = NS
          shellVelsRef.current = shellConfigs.map(
            (c) => (360 / c.durationSec) * (c.reverse ? -1 : 1),
          )
          coastStartRef.current = now
        }
      } else if (!userPaused && prev) {
        modeRef.current = 'run'
        coastStartRef.current = null
        nucleusVelRef.current = 0
        shellVelsRef.current = shellVelsRef.current.map(() => 0)
      }
      prevPausedRef.current = userPaused

      const decay = Math.exp(-COAST_DECAY_PER_S * dt)

      if (modeRef.current === 'run') {
        nucleusCumRef.current += NS * dt
        shellConfigs.forEach((c, i) => {
          shellCumsRef.current[i] +=
            (360 / c.durationSec) * (c.reverse ? -1 : 1) * dt
        })
      } else if (modeRef.current === 'coast') {
        nucleusCumRef.current += nucleusVelRef.current * dt
        nucleusVelRef.current *= decay
        shellConfigs.forEach((_, i) => {
          shellCumsRef.current[i] += shellVelsRef.current[i] * dt
          shellVelsRef.current[i] *= decay
        })
        const tCoast =
          coastStartRef.current != null ? now - coastStartRef.current : 0
        const nv = Math.abs(nucleusVelRef.current)
        const maxSv =
          shellVelsRef.current.length > 0
            ? Math.max(...shellVelsRef.current.map(Math.abs))
            : 0
        if (
          (tCoast >= COAST_MIN_MS &&
            nv < COAST_VEL_EPS &&
            maxSv < COAST_VEL_EPS) ||
          tCoast >= COAST_MAX_MS
        ) {
          modeRef.current = 'still'
          nucleusVelRef.current = 0
          shellVelsRef.current = shellVelsRef.current.map(() => 0)
          coastStartRef.current = null
        }
      }

      setOut({
        nucleusDeg: norm(nucleusCumRef.current),
        shellDegs: shellCumsRef.current.map(norm),
      })
      id = requestAnimationFrame(step)
    }

    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [elementZ])

  return out
}

/** Jedna částice v jádře; `r` = poloměr kolečka (podle počtu na kruhu). */
type NucleusParticle = {
  x: number
  y: number
  kind: 'p' | 'n'
  r?: number
}

/**
 * Poloměr tečky na kruhu poloměru `ringR` s `countOnRing` částicemi —
 * podle délky oblouku, ať se kolečka nepřekrývají a u málo částic zůstanou velká.
 */
function dotRadiusForRing(ringR: number, countOnRing: number): number {
  const MIN = 1.9
  const MAX = 4.85
  if (countOnRing <= 0) return MIN
  if (countOnRing === 1) {
    return ringR < 1.2 ? MAX : Math.min(MAX, ringR * 0.88)
  }
  const R = Math.max(ringR, 2.0)
  const arc = (2 * Math.PI * R) / countOnRing
  const fit = arc * 0.37
  return Math.max(MIN, Math.min(MAX, fit))
}

export function Atom2DModel({
  element,
  layout = 'sidebar',
  spinPaused: spinPausedProp,
  onSpinPausedChange,
}: Props) {
  const model = getAtomShellData(element.z)
  const reduceMotion = usePrefersReducedMotion()
  const [internalPaused, setInternalPaused] = useState(false)
  const [hoverTarget, setHoverTarget] = useState<
    'nucleus' | number | null
  >(null)
  const spinControlled = Boolean(onSpinPausedChange)
  const spinPaused = spinControlled
    ? (spinPausedProp ?? false)
    : internalPaused

  const shellSpinConfigs = useMemo((): ShellSpinConfig[] => {
    const m = getAtomShellData(element.z)
    if (!m) return []
    return m.shells
      .map((count, shellIndex) => ({ count, shellIndex }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => a.shellIndex - b.shellIndex)
      .map(({ shellIndex }) => ({
        durationSec: 11 + shellIndex * 2.5,
        reverse: shellIndex % 2 === 1,
      }))
  }, [element.z])

  const { nucleusDeg, shellDegs } = useSoftAtomSpin(
    element.z,
    spinPaused,
    reduceMotion,
    shellSpinConfigs,
  )

  useEffect(() => {
    setInternalPaused(false)
    setHoverTarget(null)
    if (spinControlled) onSpinPausedChange?.(false)
  }, [element.z, spinControlled, onSpinPausedChange])

  if (!model) return null

  const { shells, massNumber } = model
  const neutronCount = Math.max(0, massNumber - element.z)

  const nonEmptyShells = shells
    .map((count, shellIndex) => ({ count, shellIndex }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => a.shellIndex - b.shellIndex)

  const maxShellIdx = nonEmptyShells.reduce(
    (m, s) => Math.max(m, s.shellIndex),
    0,
  )
  const maxOrbitR = ORBIT_BASE + maxShellIdx * ORBIT_STEP
  const maxEr = Math.max(
    ELECTRON_R,
    ...nonEmptyShells.map((s) => electronRadiusForShell(s.count)),
  )
  const vb = Math.ceil(maxOrbitR + maxEr + VB_PAD)

  const isStage = layout === 'stage'
  const nucleusVisual = isStage
    ? buildNucleusParticlesReadable(element.z, neutronCount)
    : buildNucleusParticles(element.z, neutronCount)
  const palette = atomModelPaletteForElement(element)

  const nucleusTooltip = `Jádro: ${protonsLabelCs(element.z)}, ${neutronsLabelCs(neutronCount)}`

  let shellSummaryText = ''
  if (hoverTarget === 'nucleus') {
    shellSummaryText = nucleusTooltip
  } else if (typeof hoverTarget === 'number') {
    const s = nonEmptyShells.find((x) => x.shellIndex === hoverTarget)
    if (s) {
      const letter = SHELL_NAMES[s.shellIndex] ?? String(s.shellIndex + 1)
      shellSummaryText = `Vrstva ${letter}: ${electronsLabelCs(s.count)}`
    }
  }

  const toolbar: ReactNode =
    onSpinPausedChange != null ? (
      <div className="atom2d-toolbar">
        <p className="atom2d-shell-summary" aria-live="polite">
          {shellSummaryText}
        </p>
        <button
          type="button"
          className="atom2d-spin-toggle"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onSpinPausedChange(!spinPaused)
          }}
          aria-pressed={spinPaused}
          aria-label={
            spinPaused ? 'Spustit otáčení obalů' : 'Pozastavit otáčení obalů'
          }
          title={spinPaused ? 'Přehrát' : 'Pauza'}
        >
          <span className="atom2d-spin-toggle__icon" aria-hidden>
            {spinPaused ? '▶' : '⏸'}
          </span>
        </button>
      </div>
    ) : null

  return (
    <div
      className={[
        'atom2d-wrap',
        isStage ? 'atom2d-wrap--stage' : 'atom2d-wrap--sidebar',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="atom2d-disk">
        <svg
          className={['atom2d-svg', isStage ? 'atom2d-svg--stage' : '']
            .filter(Boolean)
            .join(' ')}
          viewBox={`-${vb} -${vb} ${vb * 2} ${vb * 2}`}
          aria-hidden
          onClick={
            isStage && !spinControlled
              ? (e) => {
                  e.stopPropagation()
                  setInternalPaused((p) => !p)
                }
              : undefined
          }
        >
          <NucleusGroup
            particles={nucleusVisual}
            rotationDeg={nucleusDeg}
            nucleusScale={isStage ? STAGE_NUCLEUS_SCALE : 1}
            palette={palette}
            highlighted={hoverTarget === 'nucleus'}
            tooltipTitle={nucleusTooltip}
            onHoverChange={(on) => setHoverTarget(on ? 'nucleus' : null)}
          />

          {nonEmptyShells.map(({ count, shellIndex }, idx) => {
            const r = ORBIT_BASE + shellIndex * ORBIT_STEP
            const er = electronRadiusForShell(count)
            const shellLetter =
              SHELL_NAMES[shellIndex] ?? String(shellIndex + 1)
            const shellTooltip = `Vrstva ${shellLetter}: ${electronsLabelCs(count)}`
            return (
              <ShellGroup
                key={shellIndex}
                orbitR={r}
                electronCount={count}
                electronR={er}
                rotationDeg={shellDegs[idx] ?? 0}
                palette={palette}
                highlighted={hoverTarget === shellIndex}
                tooltipTitle={shellTooltip}
                onHoverChange={(on) =>
                  setHoverTarget(on ? shellIndex : null)
                }
              />
            )
          })}
        </svg>
      </div>
      {toolbar}
    </div>
  )
}

function NucleusGroup({
  particles,
  rotationDeg,
  nucleusScale,
  palette,
  highlighted,
  tooltipTitle,
  onHoverChange,
}: {
  particles: NucleusParticle[]
  rotationDeg: number
  nucleusScale: number
  palette: AtomModelPalette
  highlighted: boolean
  tooltipTitle: string
  onHoverChange: (hovered: boolean) => void
}) {
  const scaleAttr =
    nucleusScale !== 1 ? `scale(${nucleusScale})` : undefined
  const fallbackP = nucleusScale !== 1 ? 2.28 : 3.4
  const fallbackN = nucleusScale !== 1 ? 2.05 : 3.1
  const nucleusR = nucleusScale !== 1 ? 20.5 : 19
  const hitR = nucleusR + 7
  const neonR = nucleusR + 3.1

  return (
    <g transform={`rotate(${rotationDeg})`}>
      <g transform={scaleAttr}>
        {highlighted ? (
          <>
            <circle
              r={neonR}
              fill="none"
              stroke="rgb(202 138 4 / 0.62)"
              strokeWidth={11}
            />
            <circle
              r={neonR}
              fill="none"
              stroke="rgb(250 204 21 / 0.98)"
              strokeWidth={5}
            />
            <circle
              r={neonR}
              fill="none"
              stroke="#fffbeb"
              strokeWidth={1.75}
            />
          </>
        ) : null}
        <circle
          r={nucleusR}
          fill={palette.nucleusFill}
          stroke={
            highlighted ? 'rgb(250 204 21 / 0.95)' : palette.nucleusStroke
          }
          strokeWidth={highlighted ? 2.35 : 1.35}
          className="atom2d-nucleus-face"
        />
        {particles.map((p, i) => {
          const pr =
            p.r ?? (p.kind === 'p' ? fallbackP : fallbackN)
          const prHi = highlighted ? pr * 1.12 : pr
          const sw = Math.max(0.32, Math.min(0.62, prHi * 0.14))
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={prHi}
              fill={
                highlighted
                  ? p.kind === 'p'
                    ? '#ff8a8a'
                    : '#e8e8f0'
                  : p.kind === 'p'
                    ? palette.protonFill
                    : palette.neutronFill
              }
              stroke={
                highlighted
                  ? p.kind === 'p'
                    ? '#fecaca'
                    : '#f8fafc'
                  : p.kind === 'p'
                    ? palette.protonStroke
                    : palette.neutronStroke
              }
              strokeWidth={sw}
            />
          )
        })}
        <circle
          r={hitR}
          fill="transparent"
          className="atom2d-hit atom2d-hit--nucleus"
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          onFocus={() => onHoverChange(true)}
          onBlur={() => onHoverChange(false)}
          tabIndex={0}
          aria-label={tooltipTitle}
        >
          <title>{tooltipTitle}</title>
        </circle>
      </g>
    </g>
  )
}

function ShellGroup({
  orbitR,
  electronCount,
  electronR,
  rotationDeg,
  palette,
  highlighted,
  tooltipTitle,
  onHoverChange,
}: {
  orbitR: number
  electronCount: number
  electronR: number
  rotationDeg: number
  palette: AtomModelPalette
  highlighted: boolean
  tooltipTitle: string
  onHoverChange: (hovered: boolean) => void
}) {
  const hitStroke = Math.max(36, electronR * 2 + 26)
  const electronRHover = electronR * 1.58
  return (
    <g transform={`rotate(${rotationDeg})`}>
      {highlighted ? (
        <>
          {/* „Neon“ jen z vrstvených 2D čar — bez CSS filter (plynulejší vykreslení) */}
          <circle
            r={orbitR}
            fill="none"
            stroke="rgb(34 211 238 / 0.58)"
            strokeWidth={11}
          />
          <circle
            r={orbitR}
            fill="none"
            stroke="rgb(94 234 212 / 0.98)"
            strokeWidth={5}
          />
          <circle
            r={orbitR}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.75}
          />
        </>
      ) : (
        <circle
          r={orbitR}
          fill="none"
          stroke={palette.orbitStroke}
          strokeWidth={0.9}
          opacity={0.5}
          className="atom2d-orbit"
        />
      )}
      {Array.from({ length: electronCount }, (_, ei) => {
        const ang = (2 * Math.PI * ei) / electronCount - Math.PI / 2
        const cx = orbitR * Math.cos(ang)
        const cy = orbitR * Math.sin(ang)
        const rEl = highlighted ? electronRHover : electronR
        return (
          <circle
            key={ei}
            cx={cx}
            cy={cy}
            r={rEl}
            fill={highlighted ? '#a5f3fc' : palette.electronFill}
            stroke={highlighted ? '#ecfeff' : palette.electronStroke}
            strokeWidth={highlighted ? 1.55 : 0.85}
          />
        )
      })}
      <circle
        r={orbitR}
        fill="none"
        stroke="transparent"
        strokeWidth={hitStroke}
        className="atom2d-hit atom2d-hit--orbit"
        pointerEvents="stroke"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onFocus={() => onHoverChange(true)}
        onBlur={() => onHoverChange(false)}
        tabIndex={0}
        aria-label={tooltipTitle}
      >
        <title>{tooltipTitle}</title>
      </circle>
    </g>
  )
}

function electronRadiusForShell(electronCount: number): number {
  if (electronCount >= 28) return 3.2
  if (electronCount >= 20) return 3.9
  if (electronCount >= 12) return 4.5
  return ELECTRON_R
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

/**
 * Ilustrativní jádro pro fullscreen — větší rozestupy a max. počty,
 * ať jdou protony (červená) a neutrony (šedá) od sebe rozeznat.
 */
function buildNucleusParticlesReadable(
  z: number,
  n: number,
): NucleusParticle[] {
  const out: NucleusParticle[] = []
  const minArc = 3.28

  if (z <= 1 && n === 0) {
    out.push({ x: 0, y: 0, kind: 'p', r: dotRadiusForRing(0, 1) })
    return out
  }

  const capP = Math.min(z, 26)
  const capN = Math.min(n, 16)

  const radiusForCount = (count: number) =>
    Math.min(17.8, Math.max(7.6, (count * minArc) / (2 * Math.PI)))

  let innermostProtonR = 0

  if (capP <= 11) {
    const R = radiusForCount(capP)
    innermostProtonR = R
    const rDot = dotRadiusForRing(R, capP)
    for (let i = 0; i < capP; i++) {
      const a = (2 * Math.PI * i) / capP - Math.PI / 2
      out.push({ x: R * Math.cos(a), y: R * Math.sin(a), kind: 'p', r: rDot })
    }
  } else {
    const n1 = Math.ceil(capP / 2)
    const n2 = capP - n1
    const R1 = radiusForCount(n1)
    const R2 = Math.min(18.4, R1 + 5.65)
    innermostProtonR = R1
    const rDot1 = dotRadiusForRing(R1, n1)
    for (let i = 0; i < n1; i++) {
      const a = (2 * Math.PI * i) / n1 - Math.PI / 2
      out.push({
        x: R1 * Math.cos(a),
        y: R1 * Math.sin(a),
        kind: 'p',
        r: rDot1,
      })
    }
    const rDot2 = dotRadiusForRing(R2, n2)
    for (let i = 0; i < n2; i++) {
      const a =
        (2 * Math.PI * i) / n2 - Math.PI / 2 + Math.PI / Math.max(n2, 1)
      out.push({
        x: R2 * Math.cos(a),
        y: R2 * Math.sin(a),
        kind: 'p',
        r: rDot2,
      })
    }
  }

  if (capN <= 0) return out

  const outerNeutronR = Math.max(4.3, innermostProtonR - 5.65)
  if (capN <= 8) {
    const Rn = Math.max(3.7, outerNeutronR * 0.88)
    const rDotN = dotRadiusForRing(Rn, capN)
    for (let i = 0; i < capN; i++) {
      const a = (2 * Math.PI * i) / capN - Math.PI / 2 + 0.35
      out.push({
        x: Rn * Math.cos(a),
        y: Rn * Math.sin(a),
        kind: 'n',
        r: rDotN,
      })
    }
  } else {
    const m1 = Math.ceil(capN / 2)
    const m2 = capN - m1
    const Rn1 = outerNeutronR * 0.9
    const Rn2 = Math.max(3.5, outerNeutronR * 0.52)
    const rDotN1 = dotRadiusForRing(Rn1, m1)
    for (let i = 0; i < m1; i++) {
      const a = (2 * Math.PI * i) / m1 - Math.PI / 2
      out.push({
        x: Rn1 * Math.cos(a),
        y: Rn1 * Math.sin(a),
        kind: 'n',
        r: rDotN1,
      })
    }
    const rDotN2 = dotRadiusForRing(Rn2, m2)
    for (let i = 0; i < m2; i++) {
      const a =
        (2 * Math.PI * i) / m2 - Math.PI / 2 + Math.PI / Math.max(m2, 1)
      out.push({
        x: Rn2 * Math.cos(a),
        y: Rn2 * Math.sin(a),
        kind: 'n',
        r: rDotN2,
      })
    }
  }

  return out
}

function buildNucleusParticles(z: number, n: number): NucleusParticle[] {
  const out: NucleusParticle[] = []
  const maxDots = 18
  const nP = Math.min(z, maxDots)
  const nN = Math.min(n, maxDots)

  if (z <= 1 && n === 0) {
    out.push({ x: 0, y: 0, kind: 'p', r: dotRadiusForRing(0, 1) })
    return out
  }

  const ringP = 11
  const rP = dotRadiusForRing(ringP, nP)
  for (let i = 0; i < nP; i++) {
    const ang = (2 * Math.PI * i) / Math.max(nP, 1) - Math.PI / 2
    out.push({
      x: ringP * Math.cos(ang),
      y: ringP * Math.sin(ang),
      kind: 'p',
      r: rP,
    })
  }
  const innerR = 6
  const rN = dotRadiusForRing(innerR, nN)
  for (let i = 0; i < nN; i++) {
    const ang = (2 * Math.PI * i) / Math.max(nN, 1) - Math.PI / 2 + 0.25
    out.push({
      x: innerR * Math.cos(ang),
      y: innerR * Math.sin(ang),
      kind: 'n',
      r: rN,
    })
  }
  return out
}
