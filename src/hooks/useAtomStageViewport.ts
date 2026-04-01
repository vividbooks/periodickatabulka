import { useCallback, useMemo, useState, type RefObject } from 'react'
import {
  clamp,
  MAX_ZOOM,
  MIN_ZOOM,
  type Camera,
} from './useInfiniteCanvas'

/**
 * Plátno jen se zoomem uprostřed ‚světa‘ (žádný volný pan).
 * Střed (worldSizePx/2) mapuje na střed viewportu.
 */
export function useAtomStageViewport(
  viewportRef: RefObject<HTMLElement | null>,
  worldSizePx: number,
) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 })

  const applyWheelZoom = useCallback(
    (_sx: number, _sy: number, deltaY: number) => {
      const el = viewportRef.current
      if (!el) return
      const vw = el.clientWidth
      const vh = el.clientHeight
      const delta = -deltaY * 0.0082
      const c = worldSizePx / 2
      setCamera((prev) => {
        const nextZ = clamp(prev.zoom * Math.exp(delta), MIN_ZOOM, MAX_ZOOM)
        return {
          zoom: nextZ,
          x: vw / 2 - c * nextZ,
          y: vh / 2 - c * nextZ,
        }
      })
    },
    [viewportRef, worldSizePx],
  )

  const applyTrackpadPan = useCallback(() => {}, [])

  const viewportHandlers = useMemo(
    () => ({
      onPointerDownCapture: () => {},
      onPointerMove: () => {},
      onPointerUp: () => {},
      onPointerCancel: () => {},
      onLostPointerCapture: () => {},
    }),
    [],
  )

  return {
    camera,
    setCamera,
    applyWheelZoom,
    applyTrackpadPan,
    viewportHandlers,
  }
}
