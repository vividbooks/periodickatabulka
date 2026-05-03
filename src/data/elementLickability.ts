import type { ChemicalElement } from './elements'
import { ZS_ELEMENT_CORE } from './zsElementCore'

export type OralSafetyStatus = 'yes' | 'ambiguous' | 'no'
export type LickabilityKey = OralSafetyStatus

export type OralSafetyEntry = {
  status: OralSafetyStatus
  text: string
}

export type OralSafetyProfile = {
  lick: OralSafetyEntry
}

const RADIOACTIVE_OR_SYNTHETIC = (z: number) => z === 43 || z === 61 || z >= 84

const LICK_YES_Z = new Set([
  6, 12, 13, 14, 22, 26, 40, 47, 50, 73, 74, 75, 76, 77, 78, 79, 83,
])

const LICK_AMBIGUOUS_Z = new Set([
  24, 25, 27, 28, 29, 30, 42, 44, 45, 46,
])

const CUSTOM_LICK_TEXT: Partial<Record<number, string>> = {
  4: 'Be — Beryllium: Ne. Beryllium a jeho sloučeniny jsou výrazně toxické; nebezpečný je zejména prach a vdechnutí částic.',
  6: 'C — Uhlík: Ano. Čistý uhlík v podobě grafitu, diamantu nebo aktivního uhlí je chemicky málo reaktivní; riziko ale vždy závisí na čistotě a formě.',
  9: 'F — Fluor: Ne. Fluor je extrémně reaktivní a toxický plyn; kontakt se sliznicí by byl nebezpečný.',
  12: 'Mg — Hořčík: Ano. Kompaktní kus čistého hořčíku je pro krátký kontakt poměrně málo rizikový, zatímco prášek, hořící kov nebo sloučeniny mohou být nebezpečné.',
  13: 'Al — Hliník: Ano. Čistý kompaktní hliník je za běžných podmínek málo reaktivní, protože ho chrání tenká vrstva oxidu; prášek a některé sloučeniny se chovají jinak.',
  14: 'Si — Křemík: Ano. Elementární křemík je v kompaktní podobě velmi málo reaktivní; riziko by představoval hlavně prach nebo znečištění.',
  15: 'P — Fosfor: Ne. Elementární fosfor může být velmi nebezpečný, zejména bílý fosfor; do úst nepatří žádná jeho forma.',
  22: 'Ti — Titan: Ano. Titan je v čisté kompaktní podobě velmi stálý a biokompatibilní, proto se používá i v implantátech.',
  24: 'Cr — Chrom: Sporné. Kovový chrom je poměrně stálý, ale některé sloučeniny chromu jsou výrazně toxické; rozhoduje konkrétní forma a čistota.',
  25: 'Mn — Mangan: Sporné. Mangan je stopový biogenní prvek, ale kovový prach a některé sloučeniny mohou být toxické.',
  26: 'Fe — Železo: Ano. Čisté kompaktní železo je pro krátký kontakt málo rizikové; problémem může být rez, nečistoty nebo ostrý povrch.',
  27: 'Co — Kobalt: Sporné. Kobalt je v malém množství součástí vitaminu B12, ale kovový prach a některé sloučeniny mohou být zdraví škodlivé.',
  28: 'Ni — Nikl: Sporné. Nikl často vyvolává kontaktní alergie a jeho rozpustné sloučeniny mohou být toxické, i když kompaktní kov je méně reaktivní.',
  29: 'Cu — Měď: Sporné. Měď je stopový prvek potřebný pro organismus, ale při delším kontaktu se mohou uvolňovat ionty a vyšší dávky jsou škodlivé.',
  30: 'Zn — Zinek: Sporné. Zinek je nezbytný stopový prvek, ale kovový prášek, oxidy a nadměrné množství mohou být rizikové.',
  40: 'Zr — Zirkonium: Ano. Zirkonium je v kompaktní podobě velmi stálé a používá se i v biokompatibilních materiálech; prášek je ale reaktivnější.',
  42: 'Mo — Molybden: Sporné. Molybden je potřebný stopový prvek, ale elementární kov ani jeho prach nejsou vhodné pro kontakt s ústy.',
  44: 'Ru — Ruthenium: Sporné. Kompaktní ruthenium je poměrně stálý ušlechtilý kov, ale některé jeho sloučeniny mohou být nebezpečné.',
  45: 'Rh — Rhodium: Sporné. Rhodium je v kovové podobě velmi stálé, ale jde o laboratorně neobvyklý prvek a jeho sloučeniny nelze považovat za bezpečné.',
  46: 'Pd — Palladium: Sporné. Kovové palladium je poměrně stálé, ale může vyvolávat citlivost nebo alergické reakce a některé sloučeniny jsou problematické.',
  47: 'Ag — Stříbro: Ano. Čisté kovové stříbro je pro krátký kontakt málo rizikové, ale dlouhodobé nebo opakované vystavení sloučeninám stříbra vhodné není.',
  50: 'Sn — Cín: Ano. Kovový cín je v kompaktní podobě relativně málo toxický; nebezpečné mohou být některé organocíničité sloučeniny.',
  73: 'Ta — Tantal: Ano. Tantal je velmi stálý a biokompatibilní kov, který se používá i ve zdravotnických materiálech.',
  74: 'W — Wolfram: Ano. Kompaktní wolfram je tvrdý, velmi stálý kov s nízkou rozpustností; rizikovější je prach nebo některé sloučeniny.',
  75: 'Re — Rhenium: Ano. Kompaktní rhenium je velmi stálý kov; praktické riziko by se týkalo spíš prachu, sloučenin nebo nečistot.',
  76: 'Os — Osmium: Ano. Kompaktní osmium je stálé, ale práškové osmium může tvořit vysoce toxický oxid osmičelý.',
  77: 'Ir — Iridium: Ano. Iridium patří mezi velmi stálé a málo reaktivní kovy; riziko představují hlavně jemné částice nebo sloučeniny.',
  78: 'Pt — Platina: Ano. Čistá kompaktní platina je velmi stálá a používá se ve špercích i zdravotnictví; sloučeniny platiny však mohou být dráždivé nebo toxické.',
  79: 'Au — Zlato: Ano. Čisté zlato je velmi stálé a chemicky málo reaktivní; riziko by představovaly hlavně nečistoty nebo slitiny s jinými kovy.',
  19: 'K — Draslík: Ne. Kovový draslík prudce reaguje s vodou i vlhkostí, takže kontakt se slinami by byl nebezpečný.',
  33: 'As — Arsen: Ne. Arsen a řada jeho sloučenin jsou vysoce toxické.',
  37: 'Rb — Rubidium: Ne. Rubidium je velmi reaktivní alkalický kov a prudce reaguje s vodou i vlhkostí.',
  55: 'Cs — Cesium: Ne. Cesium je extrémně reaktivní alkalický kov; kontakt se slinami by mohl vést k prudké reakci.',
  80: 'Hg — Rtuť: Ne. Rtuť je toxická zejména kvůli parám a některým sloučeninám; kontakt s ní není bezpečný.',
  81: 'Tl — Thallium: Ne. Thallium a jeho sloučeniny patří mezi velmi toxické látky.',
  83: 'Bi — Bismut: Ano. Bismut patří mezi méně toxické těžké kovy a v kompaktní podobě je poměrně stálý.',
  92: 'U — Uran: Ne. Uran je radioaktivní a zároveň chemicky toxický těžký kov.',
}

function genericLickText(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
  status: OralSafetyStatus,
): string {
  const core = ZS_ELEMENT_CORE[element.z]
  const name = core ? core.typLatkyZs : 'prvek'
  switch (status) {
    case 'yes':
      return `${element.symbol} — ${element.nameCs}: Ano. U čistého kompaktního prvku bývá krátký kontakt chemicky málo rizikový; prach, ionty, sloučeniny nebo nečistoty mohou být výrazně nebezpečnější.`
    case 'ambiguous':
      return `${element.symbol} — ${element.nameCs}: Sporné. Záleží na formě, čistotě a povrchu; kompaktní ${name} může být méně rizikový než prášek, oxidy nebo rozpustné sloučeniny.`
    case 'no':
    default:
      return `${element.symbol} — ${element.nameCs}: Ne. Kvůli reaktivitě, toxicitě nebo radioaktivitě není bezpečné dávat tento prvek do kontaktu s ústy.`
  }
}

export function oralSafetyStatusLabelCs(status: OralSafetyStatus): string {
  switch (status) {
    case 'yes':
      return 'Ano'
    case 'ambiguous':
      return 'Sporné'
    case 'no':
    default:
      return 'Ne'
  }
}

export function lickabilityForElement(
  element: Pick<ChemicalElement, 'z'>,
): LickabilityKey {
  const z = element.z
  const core = ZS_ELEMENT_CORE[z]

  if (!core) return 'no'
  if (RADIOACTIVE_OR_SYNTHETIC(z)) return 'no'
  if (core.stavPriStp !== 'pevná') return 'no'
  if (LICK_YES_Z.has(z)) return 'yes'
  if (LICK_AMBIGUOUS_Z.has(z)) return 'ambiguous'
  return 'no'
}

export function oralSafetyProfileForElement(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
): OralSafetyProfile {
  const lickStatus = lickabilityForElement(element)

  return {
    lick: {
      status: lickStatus,
      text:
        CUSTOM_LICK_TEXT[element.z] ??
        genericLickText(element, lickStatus),
    },
  }
}
