import { useEffect, useState } from 'react'
import type { ChemicalElement } from '../data/elements'
import { getAtomShellData } from '../data/shellsFromPeriodicTableJson'
import './Atom2DModel.css'

const ORBIT_BASE = 30
const ORBIT_STEP = 26
const ELECTRON_R = 5
const VB_PAD = 42

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

  return (
    <div
      className={[
        'atom2d-wrap',
        isStage ? 'atom2d-wrap--stage' : '',
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
        <defs>
          <radialGradient id={`nuc-glow-${element.z}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffccbc" />
            <stop offset="55%" stopColor="#e57373" />
            <stop offset="100%" stopColor="#c62828" />
          </radialGradient>
          <radialGradient id={`e-fill-${element.z}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e1f5fe" />
            <stop offset="100%" stopColor="#29b6f6" />
          </radialGradient>
        </defs>

        <NucleusGroup
          z={element.z}
          particles={nucleusVisual}
          freezeSpin={freezeSpin}
          nucleusScale={isStage ? STAGE_NUCLEUS_SCALE : 1}
        />

        {nonEmptyShells.map(({ count, shellIndex }) => {
          const r = ORBIT_BASE + shellIndex * ORBIT_STEP
          const sec = 11 + shellIndex * 2.5
          const reverse = shellIndex % 2 === 1
          const er = electronRadiusForShell(count)
          return (
            <ShellGroup
              key={shellIndex}
              elementZ={element.z}
              orbitR={r}
              electronCount={count}
              electronR={er}
              durationSec={sec}
              reverse={reverse}
              freezeSpin={freezeSpin}
            />
          )
        })}
      </svg>
    </div>
  )
}

function NucleusGroup({
  z,
  particles,
  freezeSpin,
  nucleusScale,
}: {
  z: number
  particles: { x: number; y: number; kind: 'p' | 'n' }[]
  freezeSpin: boolean
  nucleusScale: number
}) {
  const scaleAttr =
    nucleusScale !== 1 ? `scale(${nucleusScale})` : undefined
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
          fill={`url(#nuc-glow-${z})`}
          opacity={0.92}
        />
        {particles.map((p, i) => {
          const pr = nucleusScale !== 1 ? 2.28 : 3.4
          const nr = nucleusScale !== 1 ? 2.05 : 3.1
          const sw = nucleusScale !== 1 ? 0.38 : 0.45
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.kind === 'p' ? pr : nr}
              fill={p.kind === 'p' ? '#ff1744' : '#b0bec5'}
              stroke={p.kind === 'p' ? '#b71c1c' : '#546e7a'}
              strokeWidth={sw}
            />
          )
        })}
      </g>
    </g>
  )
}

function ShellGroup({
  elementZ,
  orbitR,
  electronCount,
  electronR,
  durationSec,
  reverse,
  freezeSpin,
}: {
  elementZ: number
  orbitR: number
  electronCount: number
  electronR: number
  durationSec: number
  reverse: boolean
  freezeSpin: boolean
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
        stroke="#64748b"
        strokeWidth={0.9}
        strokeDasharray="5 6"
        opacity={0.45}
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
            fill={`url(#e-fill-${elementZ})`}
            stroke="#01579b"
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
): { x: number; y: number; kind: 'p' | 'n' }[] {
  type P = { x: number; y: number; kind: 'p' | 'n' }
  const out: P[] = []
  const minArc = 3.28

  if (z <= 1 && n === 0) {
    out.push({ x: 0, y: 0, kind: 'p' })
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
    for (let i = 0; i < capP; i++) {
      const a = (2 * Math.PI * i) / capP - Math.PI / 2
      out.push({ x: R * Math.cos(a), y: R * Math.sin(a), kind: 'p' })
    }
  } else {
    const n1 = Math.ceil(capP / 2)
    const n2 = capP - n1
    const R1 = radiusForCount(n1)
    const R2 = Math.min(18.4, R1 + 5.65)
    innermostProtonR = R1
    for (let i = 0; i < n1; i++) {
      const a = (2 * Math.PI * i) / n1 - Math.PI / 2
      out.push({ x: R1 * Math.cos(a), y: R1 * Math.sin(a), kind: 'p' })
    }
    for (let i = 0; i < n2; i++) {
      const a =
        (2 * Math.PI * i) / n2 - Math.PI / 2 + Math.PI / Math.max(n2, 1)
      out.push({ x: R2 * Math.cos(a), y: R2 * Math.sin(a), kind: 'p' })
    }
  }

  if (capN <= 0) return out

  const outerNeutronR = Math.max(4.3, innermostProtonR - 5.65)
  if (capN <= 8) {
    const Rn = Math.max(3.7, outerNeutronR * 0.88)
    for (let i = 0; i < capN; i++) {
      const a = (2 * Math.PI * i) / capN - Math.PI / 2 + 0.35
      out.push({ x: Rn * Math.cos(a), y: Rn * Math.sin(a), kind: 'n' })
    }
  } else {
    const m1 = Math.ceil(capN / 2)
    const m2 = capN - m1
    const Rn1 = outerNeutronR * 0.9
    const Rn2 = Math.max(3.5, outerNeutronR * 0.52)
    for (let i = 0; i < m1; i++) {
      const a = (2 * Math.PI * i) / m1 - Math.PI / 2
      out.push({ x: Rn1 * Math.cos(a), y: Rn1 * Math.sin(a), kind: 'n' })
    }
    for (let i = 0; i < m2; i++) {
      const a =
        (2 * Math.PI * i) / m2 - Math.PI / 2 + Math.PI / Math.max(m2, 1)
      out.push({ x: Rn2 * Math.cos(a), y: Rn2 * Math.sin(a), kind: 'n' })
    }
  }

  return out
}

function buildNucleusParticles(
  z: number,
  n: number,
): { x: number; y: number; kind: 'p' | 'n' }[] {
  const out: { x: number; y: number; kind: 'p' | 'n' }[] = []
  const maxDots = 18
  const nP = Math.min(z, maxDots)
  const nN = Math.min(n, maxDots)

  if (z <= 1 && n === 0) {
    out.push({ x: 0, y: 0, kind: 'p' })
    return out
  }

  const ringR = 11
  for (let i = 0; i < nP; i++) {
    const ang = (2 * Math.PI * i) / Math.max(nP, 1) - Math.PI / 2
    out.push({
      x: ringR * Math.cos(ang),
      y: ringR * Math.sin(ang),
      kind: 'p',
    })
  }
  const innerR = 6
  for (let i = 0; i < nN; i++) {
    const ang = (2 * Math.PI * i) / Math.max(nN, 1) - Math.PI / 2 + 0.25
    out.push({
      x: innerR * Math.cos(ang),
      y: innerR * Math.sin(ang),
      kind: 'n',
    })
  }
  return out
}
