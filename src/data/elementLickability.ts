import type { ChemicalElement } from './elements'
import { ZS_ELEMENT_CORE } from './zsElementCore'

export type OralSafetyStatus = 'yes' | 'ambiguous' | 'no'
export type LickabilityKey = OralSafetyStatus
export type EatabilityKey = OralSafetyStatus

export type OralSafetyEntry = {
  status: OralSafetyStatus
  text: string
}

export type OralSafetyProfile = {
  lick: OralSafetyEntry
  eat: OralSafetyEntry
}

const RADIOACTIVE_OR_SYNTHETIC = (z: number) => z === 43 || z === 61 || z >= 84

const LICK_YES_Z = new Set([
  6, 12, 13, 14, 22, 26, 40, 47, 50, 73, 74, 75, 76, 77, 78, 79, 83,
])

const LICK_AMBIGUOUS_Z = new Set([
  24, 25, 27, 28, 29, 30, 42, 44, 45, 46,
])

const EAT_YES_Z = new Set([6, 22, 26, 47, 79, 83])

const EAT_AMBIGUOUS_Z = new Set([12, 14, 29, 30, 42, 78])

const CUSTOM_LICK_TEXT: Partial<Record<number, string>> = {
  4: 'Be — Beryllium: Ne. Chronická berylióza umí sežrat plíce i z mnohem menších expozic.',
  6: 'C — Uhlík: Tužka, aktivní uhlí, diamant. Chuťově nula, bezpečně nula.',
  9: 'F — Fluor: Ne. Extrémně reaktivní plyn; v puse by z toho byl okamžitý chemický průšvih.',
  12: 'Mg — Hořčík: Lehce zašumí jen v reaktivnějších formách; kompaktní kus je pro krátký kontakt spíš v klidu, ale chutná chemicky.',
  13: 'Al — Hliník: Olízni fólii. Pokud máš amalgámovou plombu, dostaneš mini-šok z galvanického článku v puse.',
  14: 'Si — Křemík: Inertní. Jako olíznout solární panel — chutná po ničem.',
  15: 'P — Fosfor: Ne. Bílý fosfor je vyloženě průšvih a ani ostatní formy nejsou dobrý nápad do pusy.',
  22: 'Ti — Titan: Biokompatibilní. Jazyk s titanem si rozumí.',
  24: 'Cr — Chrom: Sporné. Kovový chrom na nárazníku je jiný svět než rozpustné sloučeniny chromu.',
  25: 'Mn — Mangan: Sporné. Tělo ho v malém potřebuje, ale kov ani prach není něco, co chceš olizovat pravidelně.',
  26: 'Fe — Železo: Litina chutná po krvi. Není to náhoda — máme ho v hemoglobinu.',
  27: 'Co — Kobalt: Sporné. Kovový dotek krátce přežiješ, ale pořád je to těžší kov.',
  28: 'Ni — Nikl: Sporné. Pětikoruna krátce nic, ale alergici poznají nikl velmi rychle.',
  29: 'Cu — Měď: Sporné. Mince chutná jako mince, ale delší kontakt už pouští ionty.',
  30: 'Zn — Zinek: Sporné. Kompaktní kus je snesitelnější než prášek či reaktivní povrch.',
  40: 'Zr — Zirkonium: Zubní korunky se z něj dělají, takže krátký kontakt jazyk zvládne bez dramatu.',
  42: 'Mo — Molybden: Sporné. Je to mikronutrient, ale kovový kus do pusy pořád není svačina.',
  44: 'Ru — Ruthenium: Sporné. Drahý a stabilní kov, ale běžný člověk ho do pusy stejně nepotká.',
  45: 'Rh — Rhodium: Sporné. Povrchově stabilní kov, ale pořád spíš laboratorní kuriozita než lízátko.',
  46: 'Pd — Palladium: Sporné. Stabilní, ale raději ve šperku než v puse.',
  47: 'Ag — Stříbro: Stříbrná lžička ano. Jen z toho nedělej každodenní zvyk.',
  50: 'Sn — Cín: Stará plechovka nebo cínový vojáček v kompaktní podobě je krátce v pohodě.',
  73: 'Ta — Tantal: Chirurgické implantáty ho zvládají, tak jazyk taky.',
  74: 'W — Wolfram: Tvrdý, inertní, bez chuti.',
  75: 'Re — Rhenium: Pokud se ti někde povaluje, krátký kontakt bude ten nejmenší problém. Nepovaluje.',
  76: 'Os — Osmium: Ne v prášku, ten je toxický; kompaktní kus je jiný příběh, ale běžně se s ním stejně nepotkáš.',
  77: 'Ir — Iridium: Jeden z nejstabilnějších kovů vůbec. Naprostý klid.',
  78: 'Pt — Platina: Prsten ano.',
  79: 'Au — Zlato: Mince, prsten, cokoliv. Nic zásadního.',
  19: 'K — Draslík: Ne. Se slinami reaguje tak rychle, že z toho může být velmi ošklivá chemická nehoda.',
  33: 'As — Arsen: Ne. Klasický jed, který si drží reputaci už staletí.',
  37: 'Rb — Rubidium: Ne. Ještě prudší alkalický kov než sodík a draslík.',
  55: 'Cs — Cesium: Ne. Extrémně reaktivní kov, který v puse opravdu nechceš.',
  80: 'Hg — Rtuť: Ne. Kovová kapka možná projde, ale páry a chronická expozice jsou vyloženě špatný nápad.',
  81: 'Tl — Thallium: Ne. Jed travičů bez respektu.',
  83: 'Bi — Bismut: Z těžších kovů ten nejmíň dramatický; krátký kontakt je v pohodě.',
  92: 'U — Uran: Ne. Radioaktivita a toxicita z něj dělají spíš učebnicový varovný příklad.',
}

const CUSTOM_EAT_TEXT: Partial<Record<number, string>> = {
  6: 'C — Uhlík: Aktivní uhlí je přímo lék na střeva. Grafit z tužky projde prakticky beze změny.',
  12: 'Mg — Hořčík: Sporné. Doplňky stravy jsou hořečnaté soli, ne kus kovu; kompaktní Mg není akutní horor, ale není to jídlo.',
  14: 'Si — Křemík: Sporné. Křemičitany jíš běžně, ale čistý kousek křemíku je spíš zbytečná inertní věc.',
  22: 'Ti — Titan: Kdybys omylem spolknul titanový šroubek, chemicky se nic moc nestane. Zuby jsou větší problém než otrava.',
  26: 'Fe — Železo: Ve stravě ho máme pořád. Hřebík je problém pro zuby a trávení, ne primárně pro chemickou otravu.',
  29: 'Cu — Měď: Sporné. Stopově ji potřebujeme, ale spolknout kus mědi nebo si rozpustit hodně iontů nechceš.',
  30: 'Zn — Zinek: Sporné. Vitaminy ano, velký kus kovu ne; forma a dávka dělají všechno.',
  42: 'Mo — Molybden: Sporné. Je to potřebný mikronutrient, ale kovový kus pořád není rozumné jídlo.',
  47: 'Ag — Stříbro: Jedlé stříbro E174 existuje, takže malinké množství ano. Denní dieta to ale opravdu být nemá.',
  79: 'Au — Zlato: Jedlé plátky na sushi nebo v dezertu jsou přesně ten inertní případ, který jen projde trávicím traktem.',
  78: 'Pt — Platina: Sporné. Inertní by projít mohla, ale to není argument ji jíst.',
  83: 'Bi — Bismut: Bismutové soli jsou dokonce léčivé, takže tady je chemie překvapivě přátelská.',
  4: 'Be — Beryllium: Ne. Tohle fakt nepatří ani do plic, ani do pusy.',
  9: 'F — Fluor: Ne. Tohle není jídlo, ale noční můra chemika.',
  11: 'Na — Sodík: Ne. Se slinami a vodou reaguje moc prudce.',
  15: 'P — Fosfor: Ne. Forma rozhoduje, ale žádná elementární verze není dobrý nápad na svačinu.',
  19: 'K — Draslík: Ne. Reaktivita s vodou je příliš brutální.',
  33: 'As — Arsen: Ne. Tohle je historicky osvědčený jed, ne minerální doplněk.',
  37: 'Rb — Rubidium: Ne. Ještě horší verze alkalického kovu.',
  55: 'Cs — Cesium: Ne. Reaktivita a teplo z reakce jsou mimo bezpečnou zónu.',
  80: 'Hg — Rtuť: Ne. Kovová kapka možná projde, ale páry a organické formy jsou velký problém.',
  81: 'Tl — Thallium: Ne. Klasický jed travičů.',
  84: 'Po — Polonium: Ne. Mikrogramy umí zabíjet.',
  92: 'U — Uran: Ne. Radioaktivní a toxický kov do jídelníčku opravdu nepatří.',
}

function genericLickText(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
  status: OralSafetyStatus,
): string {
  const core = ZS_ELEMENT_CORE[element.z]
  const name = core ? core.typLatkyZs : 'prvek'
  switch (status) {
    case 'yes':
      return `${element.symbol} — ${element.nameCs}: Krátký kontakt s kompaktním kusem bývá nízkorizikový; větší problém dělají až ionty, prach nebo reaktivní povrch.`
    case 'ambiguous':
      return `${element.symbol} — ${element.nameCs}: Sporné. Záleží hodně na formě, čistotě a povrchu; kompaktní kus je jiný příběh než prášek, oxidy nebo rozpustné sloučeniny (${name}).`
    case 'no':
    default:
      return `${element.symbol} — ${element.nameCs}: Ne. Reaktivita, toxicita nebo radioaktivita je tady zbytečně vysoká.`
  }
}

function genericEatText(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
  status: OralSafetyStatus,
): string {
  const core = ZS_ELEMENT_CORE[element.z]
  const name = core ? core.typLatkyZs : 'prvek'
  switch (status) {
    case 'yes':
      return `${element.symbol} — ${element.nameCs}: V inertní nebo stopové podobě projde bez větší chemické reakce, ale pořád to není jídlo pro radost.`
    case 'ambiguous':
      return `${element.symbol} — ${element.nameCs}: Sporné. Jedna forma může být v pohodě, jiná problematická; u ${name} rozhoduje dávka i konkrétní chemická podoba.`
    case 'no':
    default:
      return `${element.symbol} — ${element.nameCs}: Ne. Tady už je chemie, toxicita nebo radioaktivita moc drahá legrace.`
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

export function eatabilityForElement(
  element: Pick<ChemicalElement, 'z'>,
): EatabilityKey {
  const z = element.z
  const core = ZS_ELEMENT_CORE[z]

  if (!core) return 'no'
  if (RADIOACTIVE_OR_SYNTHETIC(z)) return 'no'
  if (core.stavPriStp !== 'pevná') return 'no'
  if (EAT_YES_Z.has(z)) return 'yes'
  if (EAT_AMBIGUOUS_Z.has(z)) return 'ambiguous'
  return 'no'
}

export function oralSafetyProfileForElement(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
): OralSafetyProfile {
  const lickStatus = lickabilityForElement(element)
  const eatStatus = eatabilityForElement(element)

  return {
    lick: {
      status: lickStatus,
      text:
        CUSTOM_LICK_TEXT[element.z] ??
        genericLickText(element, lickStatus),
    },
    eat: {
      status: eatStatus,
      text:
        CUSTOM_EAT_TEXT[element.z] ??
        genericEatText(element, eatStatus),
    },
  }
}
