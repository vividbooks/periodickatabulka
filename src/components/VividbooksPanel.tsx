import { useMemo } from 'react'
import type { ChemicalElement } from '../data/elements'
import {
  VIVIDBOOKS_MAX_LESSON_CARDS,
  vividbooksBookMeta,
  vividbooksKnowledgeEntry,
  vividbooksKnowledgeIdsForElement,
  vividbooksMaterialsForKnowledgeIds,
} from '../data/vividbooksLessonsForElement'
import './VividbooksPanel.css'

type Props = {
  element: ChemicalElement
}

export function VividbooksPanel({ element }: Props) {
  const knowledgeIds = useMemo(
    () => vividbooksKnowledgeIdsForElement(element),
    [element],
  )

  const lessonCards = useMemo(() => {
    const slice = knowledgeIds.slice(0, VIVIDBOOKS_MAX_LESSON_CARDS)
    return slice
      .map((id) => vividbooksKnowledgeEntry(id))
      .filter((k): k is NonNullable<typeof k> => Boolean(k))
  }, [knowledgeIds])

  const materials = useMemo(() => {
    const m = vividbooksMaterialsForKnowledgeIds(knowledgeIds)
    return {
      worksheets: m.worksheets.slice(0, 24),
      researchAndLab: m.researchAndLab.slice(0, 24),
    }
  }, [knowledgeIds])

  const book = vividbooksBookMeta()

  return (
    <section className="vb-panel" aria-labelledby="vb-panel-heading">
      <p
        id="vb-panel-heading"
        className="vb-panel__hint"
        title={book.label}
      >
        Vividbooks — {book.bookIds.length} učebnic (chemie ZŠ) · PDF podle licence školy.
      </p>

      <h4 className="vb-panel__subh">Související lekce</h4>
      {lessonCards.length === 0 ? (
        <p className="vb-panel__empty">
          V napojených učebnicích není k tomuto prvku vybraná cílená lekce — záměrně
          neuvádíme příliš obecné materiály, které by se opakovaly skoro u každého prvku.
        </p>
      ) : (
        <ul className="vb-lesson-list">
          {lessonCards.map((k) => (
            <li key={k.id} className="vb-lesson-card">
              <a
                className="vb-lesson-card__link"
                href={k.pdfUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                title={k.name}
              >
                <div className="vb-lesson-card__thumb-wrap">
                  {k.imageUrl ? (
                    <img
                      className="vb-lesson-card__thumb"
                      src={k.imageUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="vb-lesson-card__thumb vb-lesson-card__thumb--empty" />
                  )}
                </div>
                <div className="vb-lesson-card__meta">
                  <span className="vb-lesson-card__chapter">{k.chapterName}</span>
                  <span className="vb-lesson-card__title">{k.name}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <h4 className="vb-panel__subh">Pracovní listy</h4>
      {materials.worksheets.length === 0 ? (
        <p className="vb-panel__empty">Žádný pracovní list v souvisejících lekcích.</p>
      ) : (
        <ul className="vb-doc-list">
          {materials.worksheets.map((d) => (
            <li key={d.documentUrl} className="vb-doc-card">
              <a
                className="vb-doc-card__link"
                href={d.documentUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.previewUrl ? (
                  <img
                    className="vb-doc-card__thumb"
                    src={d.previewUrl ?? undefined}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="vb-doc-card__thumb vb-doc-card__thumb--empty" />
                )}
                <span className="vb-doc-card__text">
                  <span className="vb-doc-card__name">{d.name}</span>
                  <span className="vb-doc-card__from">Lekce: {d.lessonName}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <h4 className="vb-panel__subh">Badatelské listy a laboratorní práce</h4>
      {materials.researchAndLab.length === 0 ? (
        <p className="vb-panel__empty">
          Žádný badatelský list ani laboratorní práce v souvisejících lekcích.
        </p>
      ) : (
        <ul className="vb-doc-list">
          {materials.researchAndLab.map((d) => (
            <li key={d.documentUrl} className="vb-doc-card">
              <a
                className="vb-doc-card__link"
                href={d.documentUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.previewUrl ? (
                  <img
                    className="vb-doc-card__thumb"
                    src={d.previewUrl ?? undefined}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="vb-doc-card__thumb vb-doc-card__thumb--empty" />
                )}
                <span className="vb-doc-card__text">
                  <span className="vb-doc-card__badge">
                    {d.kind === 'research' ? 'Badatelský' : 'Lab. práce'}
                  </span>
                  <span className="vb-doc-card__name">{d.name}</span>
                  <span className="vb-doc-card__from">Lekce: {d.lessonName}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
