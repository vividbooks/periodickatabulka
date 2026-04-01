import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type RefObject,
} from 'react'
import {
  PERIODIC_TABLE_ZOOM_MAX,
  PERIODIC_TABLE_ZOOM_MIN,
} from '../data/elements'

export const MIN_ZOOM = PERIODIC_TABLE_ZOOM_MIN
export const MAX_ZOOM = PERIODIC_TABLE_ZOOM_MAX

/** Po překročení vzdálenosti (px) od místa stisku bereme tah jako posun plátna, ne jako kliknutí. */
const PAN_COMMIT_PX_SQ = 6 * 6

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export type Camera = { x: number; y: number; zoom: number }

type CameraAction =
  | { type: 'wheel'; sx: number; sy: number; delta: number }
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'set'; camera: Camera }

function cameraReducer(state: Camera, action: CameraAction): Camera {
  switch (action.type) {
    case 'wheel': {
      const { sx, sy, delta } = action
      const prevZ = state.zoom
      const nextZ = clamp(prevZ * Math.exp(delta), MIN_ZOOM, MAX_ZOOM)
      const wx = (sx - state.x) / prevZ
      const wy = (sy - state.y) / prevZ
      return { zoom: nextZ, x: sx - wx * nextZ, y: sy - wy * nextZ }
    }
    case 'pan':
      return { ...state, x: state.x + action.dx, y: state.y + action.dy }
    case 'set':
      return action.camera
    default:
      return state
  }
}

export function useInfiniteCanvas(
  initial: Camera,
  viewportRef: RefObject<HTMLElement | null>,
) {
  const [camera, dispatch] = useReducer(cameraReducer, initial)
  const spaceDown = useRef(false)
  /** Levé tlačítko: čekáme, jestli jde o klik nebo tah. */
  const probe = useRef<{ pointerId: number; sx: number; sy: number } | null>(
    null,
  )
  const pan = useRef<{
    lx: number
    ly: number
    pointerId: number
  } | null>(null)

  /** Aktivní ukazatele ve viewportu (pro pinch zoom dvěma prsty). */
  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  )
  const pinchRef = useRef<{ lastDist: number } | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) spaceDown.current = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const applyWheelZoom = useCallback((sx: number, sy: number, deltaY: number) => {
    /* Vyšší faktor = citlivější zoom (kolečko / pinch). */
    const delta = -deltaY * 0.0082
    dispatch({ type: 'wheel', sx, sy, delta })
  }, [])

  /** Dvouprstý posun na trackpadu (‚scroll‘ bez Ctrl). */
  const applyTrackpadPan = useCallback((dx: number, dy: number) => {
    dispatch({ type: 'pan', dx, dy })
  }, [])

  const onPointerDownCapture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const vp = viewportRef.current
      if (vp) {
        const r = vp.getBoundingClientRect()
        pointersRef.current.set(e.pointerId, {
          x: e.clientX - r.left,
          y: e.clientY - r.top,
        })
        if (pointersRef.current.size === 2) {
          e.preventDefault()
          probe.current = null
          pan.current = null
          pinchRef.current = null
        }
      }

      const right = e.button === 2
      const middle = e.button === 1
      const spacePan = e.button === 0 && spaceDown.current

      if (middle || right || spacePan) {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        probe.current = null
        pan.current = {
          lx: e.clientX,
          ly: e.clientY,
          pointerId: e.pointerId,
        }
        return
      }

      if (e.button === 0 && pointersRef.current.size === 1) {
        probe.current = {
          pointerId: e.pointerId,
          sx: e.clientX,
          sy: e.clientY,
        }
      }
    },
    [viewportRef],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const vp = viewportRef.current
      if (vp) {
        const r = vp.getBoundingClientRect()
        pointersRef.current.set(e.pointerId, {
          x: e.clientX - r.left,
          y: e.clientY - r.top,
        })
      }

      if (pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()].slice(0, 2)
        const [a, b] = pts
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        const d = Math.max(dist, 1e-2)
        const midX = (a.x + b.x) / 2
        const midY = (a.y + b.y) / 2
        if (pinchRef.current == null) {
          pinchRef.current = { lastDist: d }
          return
        }
        const ratio = d / pinchRef.current.lastDist
        pinchRef.current.lastDist = d
        if (Math.abs(ratio - 1) < 1e-5) return
        const deltaY = -Math.log(ratio) / 0.0082
        applyWheelZoom(midX, midY, deltaY)
        return
      }

      const active = pan.current
      if (active && e.pointerId === active.pointerId) {
        const dx = e.clientX - active.lx
        const dy = e.clientY - active.ly
        pan.current = {
          lx: e.clientX,
          ly: e.clientY,
          pointerId: e.pointerId,
        }
        dispatch({ type: 'pan', dx, dy })
        return
      }

      const pr = probe.current
      if (!pr || e.pointerId !== pr.pointerId) return

      const ddx = e.clientX - pr.sx
      const ddy = e.clientY - pr.sy
      if (ddx * ddx + ddy * ddy <= PAN_COMMIT_PX_SQ) return

      const el = viewportRef.current
      if (el) {
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      dispatch({ type: 'pan', dx: ddx, dy: ddy })
      pan.current = {
        lx: e.clientX,
        ly: e.clientY,
        pointerId: e.pointerId,
      }
      probe.current = null
    },
    [viewportRef, applyWheelZoom],
  )

  const onPointerUpLike = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size < 2) pinchRef.current = null

      const pr = probe.current
      if (pr && e.pointerId === pr.pointerId) probe.current = null

      const p = pan.current
      if (p && e.pointerId === p.pointerId) {
        pan.current = null
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
    },
    [],
  )

  const onLostPointerCapture = useCallback(() => {
    pan.current = null
    probe.current = null
    pointersRef.current.clear()
    pinchRef.current = null
  }, [])

  const setCamera = useCallback((next: Camera) => {
    dispatch({ type: 'set', camera: next })
  }, [])

  const viewportHandlers = useMemo(
    () => ({
      onPointerDownCapture,
      onPointerMove,
      onPointerUp: onPointerUpLike,
      onPointerCancel: onPointerUpLike,
      onLostPointerCapture,
    }),
    [
      onPointerDownCapture,
      onPointerMove,
      onPointerUpLike,
      onLostPointerCapture,
    ],
  )

  return {
    camera,
    setCamera,
    applyWheelZoom,
    applyTrackpadPan,
    viewportHandlers,
  }
}
