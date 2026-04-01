import type { ChemicalElement } from './elements'
import { collectVividbooksLessonIds } from './vividbooksLessonMappings'
import { KNOWLEDGE_BY_ID, vividbooksBooksMetaList } from './vividbooksMerged'

/**
 * Pořadí ID lekcí souvisejících s prvkem (nejvíc specifické první).
 * Obecné lekce se neopakují u každého kovu bezhlavě — výběr je v `vividbooksLessonMappings.ts`.
 */
export function vividbooksKnowledgeIdsForElement(el: ChemicalElement): number[] {
  return collectVividbooksLessonIds(el).filter((id) => KNOWLEDGE_BY_ID.has(id))
}

export function vividbooksKnowledgeEntry(id: number) {
  return KNOWLEDGE_BY_ID.get(id)
}

export function vividbooksBookMeta() {
  const books = vividbooksBooksMetaList()
  return {
    bookIds: books.map((b) => b.bookId),
    bookNames: books.map((b) => b.bookName),
    /** Jedna řádka do UI */
    label: books.map((b) => `${b.bookName} (${b.bookId})`).join(' · '),
  }
}

export type FlattenedDoc = {
  knowledgeId: number
  lessonName: string
  name: string
  previewUrl: string | null
  documentUrl: string | null
  kind: 'worksheet' | 'research' | 'lab'
}

/** Pracovní listy se „řešením“ nebo klíčem odpovědí do výpisu nedáváme. */
export function isVividbooksSolutionDocument(name: string): boolean {
  const n = name.toLowerCase()
  return /řešení|správné\s+odpovědi|správné\s+ode|–\s*řešení/.test(n)
}

/**
 * Seskupí materiály ze všech vybraných lekcí; duplicity podle URL vyřadí.
 */
export function vividbooksMaterialsForKnowledgeIds(
  knowledgeIds: number[],
): {
  worksheets: FlattenedDoc[]
  researchAndLab: FlattenedDoc[]
} {
  const seen = new Set<string>()
  const worksheets: FlattenedDoc[] = []
  const researchAndLab: FlattenedDoc[] = []

  for (const kid of knowledgeIds) {
    const kn = KNOWLEDGE_BY_ID.get(kid)
    if (!kn) continue
    for (const d of kn.documents) {
      const docUrl = d.documentUrl
      if (!docUrl || seen.has(docUrl)) continue

      if (d.type === 'worksheet') {
        if (isVividbooksSolutionDocument(d.name)) continue
        seen.add(docUrl)
        worksheets.push({
          knowledgeId: kid,
          lessonName: kn.name,
          name: d.name,
          previewUrl: d.previewUrl,
          documentUrl: docUrl,
          kind: 'worksheet',
        })
        continue
      }

      if (d.type === 'experiment') {
        if (isVividbooksSolutionDocument(d.name)) continue
        const n = d.name.toLowerCase()
        let kind: 'research' | 'lab' | null = null
        if (/badatelsk/.test(n)) kind = 'research'
        else if (/lab\.\s*pr/.test(n) || /laboratorní/.test(n)) kind = 'lab'
        if (kind) {
          seen.add(docUrl)
          researchAndLab.push({
            knowledgeId: kid,
            lessonName: kn.name,
            name: d.name,
            previewUrl: d.previewUrl,
            documentUrl: docUrl,
            kind,
          })
        }
      }
    }
  }

  const isResearch = (x: FlattenedDoc) => x.kind === 'research'
  const isLab = (x: FlattenedDoc) => x.kind === 'lab'

  return {
    worksheets,
    researchAndLab: [
      ...researchAndLab.filter(isResearch),
      ...researchAndLab.filter(isLab),
    ],
  }
}

/** Kolik karet lekcí zobrazit v panelu (zbytek je v PDF / app). */
export const VIVIDBOOKS_MAX_LESSON_CARDS = 12
