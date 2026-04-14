import { memo } from 'react'
import type { ExploreLegendBarButton } from '../data/classificationExplore'
import './CategoryLegendBar.css'

type Props = {
  buttons: readonly ExploreLegendBarButton[]
  /** Zvýrazněná skupina: hover má přednost před klikem (řídí rodič). */
  highlighted: string | null
  /** Sticky stav po kliku (pro aria-pressed). */
  clicked: string | null
  onHover: (key: string | null) => void
  /** Druhý klik na stejné tlačítko zruší filtr. */
  onToggle: (key: string) => void
  /** Volitelný popisek toolbaru (přístupnost). */
  ariaLabel?: string
}

export const CategoryLegendBar = memo(function CategoryLegendBar({
  buttons,
  highlighted,
  clicked,
  onHover,
  onToggle,
  ariaLabel = 'Legenda skupin prvku periodické tabulky',
}: Props) {
  return (
    <div
      className="app-legend-bar"
      role="toolbar"
      aria-label={ariaLabel}
      onMouseLeave={() => onHover(null)}
    >
      {buttons.map((item) => {
        const on = highlighted != null && highlighted === item.id
        const off = highlighted != null && highlighted !== item.id
        return (
          <button
            key={item.id}
            type="button"
            className={[
              'app-legend-btn',
              `app-legend-btn--${item.style}`,
              on ? 'app-legend-btn--on' : '',
              off ? 'app-legend-btn--off' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onMouseEnter={() => onHover(item.id)}
            onFocus={() => onHover(item.id)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) onHover(null)
            }}
            onClick={() => onToggle(item.id)}
            aria-pressed={clicked === item.id}
          >
            {item.id === 'halogen' ? (
              <span className="app-legend-halogen-mark" aria-hidden>
                ×
              </span>
            ) : null}
            {item.label}
          </button>
        )
      })}
    </div>
  )
})
