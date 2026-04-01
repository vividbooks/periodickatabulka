import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from 'react'
import type { Camera } from '../hooks/useInfiniteCanvas'
import './InfiniteCanvas.css'

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as MutableRefObject<T | null>).current = node
    }
  }
}

type Props = {
  camera: Camera
  children: ReactNode
  className?: string
  /** Výchozí text popisuje tabulku; u jiného plátna předej vlastní. */
  ariaLabel?: string
  applyWheelZoom: (sx: number, sy: number, deltaY: number) => void
  applyTrackpadPan: (dx: number, dy: number) => void
} & Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | 'onPointerDownCapture'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onLostPointerCapture'
>

export const InfiniteCanvas = forwardRef<HTMLDivElement, Props>(
  function InfiniteCanvas(
    {
      camera,
      children,
      className = '',
      ariaLabel = 'Plátno s periodickou tabulkou. Levým tlačítkem táhni pro posun; Ctrl a kolečko mění měřítko.',
      applyWheelZoom,
      applyTrackpadPan,
      onPointerDownCapture,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture,
    },
    ref,
  ) {
    const localRef = useRef<HTMLDivElement>(null)
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        mergeRefs(ref, localRef)(node)
      },
      [ref],
    )

    useEffect(() => {
      const el = localRef.current
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = el.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const pinchZoom = e.ctrlKey || e.metaKey
        const likelyMouseWheelZoom =
          !pinchZoom &&
          e.deltaX === 0 &&
          e.deltaMode !== WheelEvent.DOM_DELTA_PIXEL

        if (pinchZoom || likelyMouseWheelZoom) {
          applyWheelZoom(sx, sy, e.deltaY)
        } else {
          let dx = -e.deltaX
          let dy = -e.deltaY
          if (e.shiftKey && dx === 0 && dy !== 0) {
            dx = -dy
            dy = 0
          }
          applyTrackpadPan(dx, dy)
        }
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => el.removeEventListener('wheel', onWheel)
    }, [applyWheelZoom, applyTrackpadPan])

    return (
      <div
        ref={setRefs}
        className={`infinite-canvas-viewport ${className}`.trim()}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onContextMenu={(e) => e.preventDefault()}
        onAuxClick={(e) => {
          if (e.button === 1) e.preventDefault()
        }}
        tabIndex={0}
        role="application"
        aria-label={ariaLabel}
      >
        <div
          className="infinite-canvas-world"
          style={{
            transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    )
  },
)
