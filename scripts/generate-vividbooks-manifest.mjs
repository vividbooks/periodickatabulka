/**
 * Stáhne knihu 73 (Chemie – Atomy a prvky) a zapíše zmenšený manifest pro app.
 * Spuštění: node scripts/generate-vividbooks-manifest.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../src/data/vividbooks-chem-73.json')

const url =
  process.env.VIVIDBOOKS_BOOK_URL ??
  'https://api.vividbooks.com/v1/books/73?user-code=pascal'

async function main() {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const b = await res.json()

  const slim = {
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

  fs.writeFileSync(OUT, JSON.stringify(slim, null, 0), 'utf8')
  console.log('Wrote', OUT, fs.statSync(OUT).size, 'bytes')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
