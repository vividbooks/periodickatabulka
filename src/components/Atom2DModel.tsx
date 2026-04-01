import { useEffect, useState } from 'react'
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
/** Minimální okraj viewBoxu kolem vnější slupky (px v SVG prostoru) — menší = větší atom v kruhu. */
const VB_PAD = 10

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
  const spinControlled = Boolean(onSpinPausedChange)
  const spinPaused = spinControlled
    ? (spinPausedProp ?? false)
    : internalPaused

  useEffect(() => {
    setInternalPaused(false)
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
  const freezeSpin = reduceMotion || spinPaused
  const palette = atomModelPaletteForElement(element)

  return (
    <div
      className={[
        'atom2d-wrap',
        isStage ? 'atom2d-wrap--stage' : 'atom2d-wrap--sidebar',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
          freezeSpin={freezeSpin}
          nucleusScale={isStage ? STAGE_NUCLEUS_SCALE : 1}
          palette={palette}
        />

        {nonEmptyShells.map(({ count, shellIndex }) => {
          const r = ORBIT_BASE + shellIndex * ORBIT_STEP
          const sec = 11 + shellIndex * 2.5
          const reverse = shellIndex % 2 === 1
          const er = electronRadiusForShell(count)
          return (
            <ShellGroup
              key={shellIndex}
              orbitR={r}
              electronCount={count}
              electronR={er}
              durationSec={sec}
              reverse={reverse}
              freezeSpin={freezeSpin}
              palette={palette}
            />
          )
        })}
      </svg>
    </div>
  )
}

function NucleusGroup({
  particles,
  freezeSpin,
  nucleusScale,
  palette,
}: {
  particles: NucleusParticle[]
  freezeSpin: boolean
  nucleusScale: number
  palette: AtomModelPalette
}) {
  const scaleAttr =
    nucleusScale !== 1 ? `scale(${nucleusScale})` : undefined
  const fallbackP = nucleusScale !== 1 ? 2.28 : 3.4
  const fallbackN = nucleusScale !== 1 ? 2.05 : 3.1
  return (
    <g>
      {!freezeSpin && (
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 0 0"
          to="360 0 0"
          dur="22s"
          repeatCount="indefinite"
        />
      )}
      <g transform={scaleAttr}>
        <circle
          r={nucleusScale !== 1 ? 20.5 : 19}
          fill={palette.nucleusFill}
          stroke={palette.nucleusStroke}
          strokeWidth={1.35}
        />
        {particles.map((p, i) => {
          const pr =
            p.r ?? (p.kind === 'p' ? fallbackP : fallbackN)
          const sw = Math.max(0.32, Math.min(0.62, pr * 0.14))
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={pr}
              fill={p.kind === 'p' ? palette.protonFill : palette.neutronFill}
              stroke={p.kind === 'p' ? palette.protonStroke : palette.neutronStroke}
              strokeWidth={sw}
            />
          )
        })}
      </g>
    </g>
  )
}

function ShellGroup({
  orbitR,
  electronCount,
  electronR,
  durationSec,
  reverse,
  freezeSpin,
  palette,
}: {
  orbitR: number
  electronCount: number
  electronR: number
  durationSec: number
  reverse: boolean
  freezeSpin: boolean
  palette: AtomModelPalette
}) {
  const dur = `${durationSec}s`
  return (
    <g>
      {!freezeSpin && (
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 0 0"
          to={reverse ? '-360 0 0' : '360 0 0'}
          dur={dur}
          repeatCount="indefinite"
        />
      )}
      <circle
        r={orbitR}
        fill="none"
        stroke={palette.orbitStroke}
        strokeWidth={0.9}
        strokeDasharray="5 6"
        opacity={0.5}
      />
      {Array.from({ length: electronCount }, (_, ei) => {
        const ang = (2 * Math.PI * ei) / electronCount - Math.PI / 2
        const cx = orbitR * Math.cos(ang)
        const cy = orbitR * Math.sin(ang)
        return (
          <circle
            key={ei}
            cx={cx}
            cy={cy}
            r={electronR}
            fill={palette.electronFill}
            stroke={palette.electronStroke}
            strokeWidth={0.85}
          />
        )
      })}
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
