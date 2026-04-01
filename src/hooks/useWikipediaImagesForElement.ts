import { useEffect, useState } from 'react'
import type { ChemicalElement } from '../data/elements'
import {
  fetchWikipediaImagesForElement,
  type WikipediaImageItem,
} from '../utils/wikipediaElementImages'

export function useWikipediaImagesForElement(element: ChemicalElement) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<WikipediaImageItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setItems([])
    setError(null)
    fetchWikipediaImagesForElement(element)
      .then((list) => {
        if (!cancelled) {
          setItems(list)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Obrázky se nepodařilo načíst.')
          setItems([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [element.z])

  return { loading, items, error }
}
