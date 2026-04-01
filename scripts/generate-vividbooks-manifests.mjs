/**
 * Stáhne z Vividbooks API zmenšené manifesty pro více knih chemie.
 * Spuštění: node scripts/generate-vividbooks-manifests.mjs
 *
 * Volitelně: VIVIDBOOKS_BOOK_IDS=73,82,88
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, '../src/data')

const DEFAULT_IDS = [73, 82, 88, 91, 94, 97, 100, 103]

function slimBook(b) {
  return {
    bookId: b.id,
    bookName: b.name,
    knowledge: b.chapters.flatMap((ch) =>
      ch.knowledge.map((k) => ({
        id: k.id,
        name: k.name,
        chapterName: ch.name,
        imageUrl: k.imageUrl ?? null,
        pdfUrl: k.pdfUrl ?? null,
        pdfUrlExt: k.extendedPdfUrl ?? null,
        documents: (k.documents ?? []).map((d) => ({
          type: d.type,
          name: d.name,
          previewUrl: d.previewUrl ?? null,
          documentUrl: d.documentUrl ?? null,
        })),
      })),
    ),
  }
}

async function main() {
  const env = process.env.VIVIDBOOKS_BOOK_IDS
  const ids = env
    ? env.split(/[\s,]+/).map((s) => parseInt(s.trim(), 10)).filter(Boolean)
    : DEFAULT_IDS

  for (const id of ids) {
    const url = `https://api.vividbooks.com/v1/books/${id}?user-code=pascal`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Book ${id}: HTTP ${res.status}`)
    const b = await res.json()
    const slim = slimBook(b)
    const out = path.join(DATA, `vividbooks-chem-${id}.json`)
    fs.writeFileSync(out, JSON.stringify(slim, null, 0), 'utf8')
    console.log('Wrote', out, fs.statSync(out).size, 'bytes', slim.knowledge.length, 'lessons')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
