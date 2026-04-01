import type { WikipediaImageItem } from '../utils/wikipediaElementImages'
import './WikipediaImagesPanel.css'

type Props = {
  items: WikipediaImageItem[]
}

/** Zobrazí se jen když rodič už ověřil, že `items.length > 0`. */
export function WikipediaImagesPanel({ items }: Props) {
  return (
    <div className="wiki-img-panel">
      <p className="wiki-img-panel__hint">
        Náhledy z článku o prvku na Wikipedii (primárně cs.wikipedia.org). Kliknutím
        otevřeš soubor na Wikimedia Commons.
      </p>
      <ul className="wiki-img-panel__grid">
        {items.map((img, i) => (
          <li key={`${img.fullUrl}-${i}`} className="wiki-img-panel__cell">
            <a
              className="wiki-img-panel__link"
              href={img.filePageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="wiki-img-panel__thumb"
                src={img.thumbUrl}
                alt=""
                loading="lazy"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
