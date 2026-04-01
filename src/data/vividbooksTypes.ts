export type VividbooksManifestDoc = {
  type: string
  name: string
  previewUrl: string | null
  documentUrl: string | null
}

export type VividbooksManifestKnowledge = {
  id: number
  name: string
  chapterName: string
  imageUrl: string | null
  pdfUrl: string | null
  pdfUrlExt: string | null
  documents: VividbooksManifestDoc[]
}

export type VividbooksChemManifest = {
  bookId: number
  bookName: string
  knowledge: VividbooksManifestKnowledge[]
}
