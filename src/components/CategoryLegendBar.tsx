import { memo } from 'react'
import { LEGEND_BUTTONS, type LegendCategoryKey } from '../data/legendCategories'
import './CategoryLegendBar.css'

type Props = {
  /** Zvýrazněná skupina: hover má přednost před klikem (řídí rodič). */
  highlighted: LegendCategoryKey | null
  /** Sticky stav po kliku (pro aria-pressed). */
  clicked: LegendCategoryKey | null
  onHover: (key: LegendCategoryKey | null) => void
  /** Druhý klik na stejné tlačítko zruší filtr. */
  onToggle: (key: LegendCategoryKey) => void
}

export const CategoryLegendBar = memo(function CategoryLegendBar({
  highlighted,
  clicked,
  onHover,
  onToggle,
}: Props) {
  return (
    <div
      className="app-legend-bar"
      role="toolbar"
      aria-label="Legenda skupin prvku periodické tabulky"
      onMouseLeave={() => onHover(null)}
    >
      {LEGEND_BUTTONS.map((item) => {
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
