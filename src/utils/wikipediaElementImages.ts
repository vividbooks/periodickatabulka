/**
 * Obrázky z článku o prvku na Wikipedii (primárně cs, při nouzi en přes langlink).
 */

import type { ChemicalElement } from '../data/elements'

const API_CS = 'https://cs.wikipedia.org/w/api.php'
const API_EN = 'https://en.wikipedia.org/w/api.php'

function apiUrl(base: string, params: Record<string, string>): string {
  const p = new URLSearchParams({ ...params, format: 'json', origin: '*' })
  return `${base}?${p}`
}

function shouldSkipImageTitle(title: string): boolean {
  const t = title.toLowerCase()
  return (
    /\.svg$/i.test(t) ||
    /icon|logo|commons|wiktionary|broom|oojs|pictogram|ghs-|flag|map[_\-]/i.test(
      t,
    )
  )
}

async function fetchEnglishTitleFromCs(csTitle: string): Promise<string | null> {
  const url = apiUrl(API_CS, {
    action: 'query',
    titles: csTitle,
    prop: 'langlinks',
    lllang: 'en',
    lllimit: '1',
  })
  const r = await fetch(url)
  if (!r.ok) return null
  const data = (await r.json()) as {
    query?: { pages?: Record<string, { langlinks?: { title: string }[] }> }
  }
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.langlinks?.[0]?.title ?? null
}

async function searchFirstTitle(
  base: string,
  query: string,
): Promise<string | null> {
  const url = apiUrl(base, {
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '0',
    srlimit: '1',
  })
  const r = await fetch(url)
  if (!r.ok) return null
  const data = (await r.json()) as {
    query?: { search?: { title: string }[] }
  }
  return data.query?.search?.[0]?.title ?? null
}

async function listImageTitles(articleTitle: string, api: string): Promise<string[]> {
  const url = apiUrl(api, {
    action: 'query',
    titles: articleTitle,
    prop: 'images',
    imlimit: '40',
  })
  const r = await fetch(url)
  if (!r.ok) return []
  const data = (await r.json()) as {
    query?: { pages?: Record<string, { missing?: boolean; images?: { title: string }[] }> }
  }
  const page = Object.values(data.query?.pages ?? {})[0]
  if (!page || page.missing || !page.images) return []
  return page.images.map((x) => x.title).filter((t) => !shouldSkipImageTitle(t))
}

export type WikipediaImageItem = {
  title: string
  thumbUrl: string
  fullUrl: string
  filePageUrl: string
}

async function resolveImageUrlsFixed(
  fileTitles: string[],
  api: string,
): Promise<WikipediaImageItem[]> {
  const out: WikipediaImageItem[] = []
  const batchSize = 8
  for (let i = 0; i < fileTitles.length; i += batchSize) {
    const batch = fileTitles.slice(i, i + batchSize)
    const url = apiUrl(api, {
      action: 'query',
      titles: batch.join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '360',
    })
    const r = await fetch(url)
    if (!r.ok) continue
    const data = (await r.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string
            imageinfo?: {
              thumburl?: string
              url?: string
              descriptionurl?: string
            }[]
          }
        >
      }
    }
    for (const page of Object.values(data.query?.pages ?? {})) {
      const ii = page.imageinfo?.[0]
      if (!ii?.url) continue
      out.push({
        title: page.title ?? '',
        thumbUrl: ii.thumburl ?? ii.url,
        fullUrl: ii.url,
        filePageUrl: ii.descriptionurl ?? ii.url,
      })
    }
  }
  return out
}

export async function fetchWikipediaImagesForElement(
  el: ChemicalElement,
): Promise<WikipediaImageItem[]> {
  const csName = el.nameCs
  let article = csName

  let titles = await listImageTitles(article, API_CS)
  if (titles.length === 0) {
    const found = await searchFirstTitle(API_CS, csName)
    if (found) {
      article = found
      titles = await listImageTitles(article, API_CS)
    }
  }

  let api = API_CS
  if (titles.length === 0) {
    const enTitle = await fetchEnglishTitleFromCs(article)
    if (enTitle) {
      article = enTitle
      titles = await listImageTitles(article, API_EN)
      api = API_EN
    }
  }

  if (titles.length === 0) {
    const enSearch = await searchFirstTitle(API_EN, `${el.symbol} chemical element`)
    if (enSearch) {
      titles = await listImageTitles(enSearch, API_EN)
      api = API_EN
    }
  }

  const slice = titles.slice(0, 16)
  if (slice.length === 0) return []

  return resolveImageUrlsFixed(slice, api)
}
