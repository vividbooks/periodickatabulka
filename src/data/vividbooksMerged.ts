import type { VividbooksChemManifest, VividbooksManifestKnowledge } from './vividbooksTypes'
import m100 from './vividbooks-chem-100.json'
import m103 from './vividbooks-chem-103.json'
import m73 from './vividbooks-chem-73.json'
import m82 from './vividbooks-chem-82.json'
import m88 from './vividbooks-chem-88.json'
import m91 from './vividbooks-chem-91.json'
import m94 from './vividbooks-chem-94.json'
import m97 from './vividbooks-chem-97.json'

const manifests: VividbooksChemManifest[] = [
  m73 as VividbooksChemManifest,
  m82 as VividbooksChemManifest,
  m88 as VividbooksChemManifest,
  m91 as VividbooksChemManifest,
  m94 as VividbooksChemManifest,
  m97 as VividbooksChemManifest,
  m100 as VividbooksChemManifest,
  m103 as VividbooksChemManifest,
]

export const vividbooksKnowledgeList: VividbooksManifestKnowledge[] =
  manifests.flatMap((m) => m.knowledge)

export const KNOWLEDGE_BY_ID = new Map(
  vividbooksKnowledgeList.map((k) => [k.id, k]),
)

export function vividbooksBooksMetaList() {
  return manifests.map((m) => ({ bookId: m.bookId, bookName: m.bookName }))
}
