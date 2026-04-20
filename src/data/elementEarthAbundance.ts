import type { ChemicalElement } from './elements'

export type EarthAbundancePercent = number

type EarthAbundanceEntry = {
  percent: EarthAbundancePercent
  note: string
}

/**
 * Výuková bulk-abundance data pro celou Zemi (kůra + plášť + jádro + atmosféra/oceány tam,
 * kde to dává smysl). Čísla jsou záměrně přibližná a u ultra-stopových nebo čistě umělých
 * prvků držíme prakticky nulu, aby heatmapa fungovala didakticky.
 */
const EARTH_ABUNDANCE: Partial<Record<number, EarthAbundanceEntry>> = {
  1: { percent: 0.03, note: 'Hlavně v oceánech a hydratovaných minerálech; lehká část uniká do vesmíru.' },
  2: { percent: 0.0000001, note: 'Jen stopově v atmosféře a zemním plynu; na Zemi průběžně uniká do vesmíru.' },
  3: { percent: 0.00001, note: 'Velmi vzácně v minerálech a slaných vodách.' },
  4: { percent: 0.000007, note: 'Jen ultra-stopově v některých minerálech.' },
  5: { percent: 0.000005, note: 'Stopově v minerálech a sedimentech.' },
  6: { percent: 0.07, note: 'Vázaný v živé hmotě, uhlíku, karbonátech a CO2.' },
  7: { percent: 0.0001, note: 'Na celé Zemi málo; v atmosféře a organické hmotě.' },
  8: { percent: 30.1, note: 'Obrovská část Země je kyslík vázaný v silikátech pláště a kůry.' },
  9: { percent: 0.0025, note: 'Jen stopově v minerálech, hlavně jako fluoridy.' },
  10: { percent: 0.00000005, note: 'V atmosféře jen mikroskopicky.' },
  11: { percent: 0.18, note: 'Hlavně v kůře a oceánech jako součást solí.' },
  12: { percent: 13.9, note: 'Jeden z hlavních stavebních prvků pláště; silikáty hořčíku.' },
  13: { percent: 1.41, note: 'Typicky v kůře a svrchních silikátech.' },
  14: { percent: 15.1, note: 'Klíčový stavební prvek silikátů pláště i kůry.' },
  15: { percent: 0.19, note: 'Menší příměs v minerálech a ve slitinách jádra/pláště.' },
  16: { percent: 2.9, note: 'Významně v jádře, menší část v sulfidech.' },
  17: { percent: 0.0017, note: 'Hlavně v oceánech a slaných roztocích.' },
  18: { percent: 0.0001, note: 'Vzácný plyn; většina je v atmosféře.' },
  19: { percent: 0.016, note: 'Menší, ale měřitelná část kůry a pláště.' },
  20: { percent: 1.54, note: 'Důležitá složka kůry a pláště, typicky v silikátech.' },
  21: { percent: 0.001, note: 'Stopově v horninách; běžně v ppm řádu.' },
  22: { percent: 0.081, note: 'Vedlejší příměs v horninách a minerálech.' },
  23: { percent: 0.0082, note: 'Stopově v plášti a kůře.' },
  24: { percent: 0.47, note: 'Měřitelně v plášti a jádru, menší část i v kůře.' },
  25: { percent: 0.075, note: 'Vedlejší prvek silikátů a oxidů.' },
  26: { percent: 32.1, note: 'Největší podíl celé planety; většina železa je v jádře.' },
  27: { percent: 0.088, note: 'Vedlejší příměs hlavně ve ferromagnetických minerálech a jádru.' },
  28: { percent: 1.82, note: 'Druhý nejdůležitější kov jádra po železu.' },
  29: { percent: 0.0055, note: 'Stopově v rudách a sulfidech.' },
  30: { percent: 0.0055, note: 'Stopově v rudách a sulfidech; v kůře pořád jen zlomek procenta.' },
  31: { percent: 0.0003, note: 'Jen stopově v kůře.' },
  32: { percent: 0.00011, note: 'Velmi vzácně, většinou v sulfidech a stopových minerálech.' },
  33: { percent: 0.000005, note: 'Jen ultra-stopově v rudách a sulfidech.' },
  34: { percent: 0.0000075, note: 'Stopově, často spolu se sírou v sulfidech.' },
  35: { percent: 0.000005, note: 'Ultra-stopově; část v mořích a solankách.' },
  36: { percent: 0.00000005, note: 'Vzácný plyn, jen stopově v atmosféře.' },
  37: { percent: 0.00006, note: 'Velmi vzácně v minerálech.' },
  38: { percent: 0.002, note: 'Stopově v minerálech a karbonátech.' },
  39: { percent: 0.00043, note: 'Stopově v kůře a vzácných minerálech.' },
  40: { percent: 0.00105, note: 'Stopově v kůře; častěji v těžších minerálech.' },
  41: { percent: 0.000066, note: 'Velmi vzácně v minerálech.' },
  42: { percent: 0.000005, note: 'Ultra-stopově v rudách a molybdenitech.' },
  43: { percent: 0, note: 'Jen jako produkt radioaktivního rozpadu; v přírodě prakticky nula.' },
  44: { percent: 0.0000005, note: 'Siderofilní kov; v plášti stopově, velká část se schovala do jádra.' },
  45: { percent: 0.00000009, note: 'Siderofilní kov, na povrchu Země extrémně vzácný.' },
  46: { percent: 0.0000004, note: 'Siderofilní kov; větší část je hluboko v jádře.' },
  47: { percent: 0.0000008, note: 'Velmi vzácně v rudách; mnohem méně než měď či olovo.' },
  48: { percent: 0.000004, note: 'Ultra-stopově v sulfidických rudách.' },
  49: { percent: 0.0000011, note: 'Jen velmi vzácně v rudách.' },
  50: { percent: 0.000013, note: 'Velmi vzácně v kůře a rudách.' },
  51: { percent: 0.0000005, note: 'Jen stopově v sulfidech a rudách.' },
  52: { percent: 0.0000012, note: 'Ultra-stopově v sulfidech a telluridech.' },
  53: { percent: 0.000001, note: 'Jen velmi vzácně v mořských systémech a stopových minerálech.' },
  54: { percent: 0.00000002, note: 'Vzácný plyn; v atmosféře jen mikroskopicky.' },
  55: { percent: 0.0000021, note: 'Ultra-stopově v minerálech a slaných vodách.' },
  56: { percent: 0.00066, note: 'Stopově v kůře, často v těžších minerálech.' },
  57: { percent: 0.000065, note: 'Velmi vzácně v minerálech vzácných zemin.' },
  58: { percent: 0.00017, note: 'Nejčastější z lehčích vzácných zemin; pořád jen stopově.' },
  59: { percent: 0.000025, note: 'Velmi vzácně v minerálech vzácných zemin.' },
  60: { percent: 0.000125, note: 'Stopově ve vzácných zeminách.' },
  61: { percent: 0, note: 'V přírodě jen prakticky neměřitelné stopy z rozpadu.' },
  62: { percent: 0.000041, note: 'Stopově ve vzácných zeminách.' },
  63: { percent: 0.000015, note: 'Velmi vzácná zemina v ppm a podppm řádu.' },
  64: { percent: 0.000054, note: 'Stopově ve vzácných zeminách.' },
  65: { percent: 0.0000099, note: 'Jen velmi vzácně ve vzácných zeminách.' },
  66: { percent: 0.000067, note: 'Velmi vzácně ve vzácných zeminách.' },
  67: { percent: 0.000015, note: 'Jen stopově ve vzácných zeminách.' },
  68: { percent: 0.000044, note: 'Velmi vzácně ve vzácných zeminách.' },
  69: { percent: 0.000007, note: 'Jen ultra-stopově ve vzácných zeminách.' },
  70: { percent: 0.000044, note: 'Velmi vzácně ve vzácných zeminách.' },
  71: { percent: 0.000007, note: 'Jen ultra-stopově ve vzácných zeminách.' },
  72: { percent: 0.000028, note: 'Velmi vzácně v těžkých minerálech.' },
  73: { percent: 0.0000037, note: 'Ultra-stopově v minerálech; těžký refrakterní kov.' },
  74: { percent: 0.0000029, note: 'Velmi vzácně, hlavně v tungstatech.' },
  75: { percent: 0.00000003, note: 'Siderofilní a ultra-stopový kov.' },
  76: { percent: 0.0000003, note: 'Siderofilní kov; na povrchu jen mizivě.' },
  77: { percent: 0.0000003, note: 'Siderofilní kov, prakticky vše důležité je hluboko v jádře.' },
  78: { percent: 0.0000007, note: 'Siderofilní kov; v kůře a plášti jen stopově, v jádře pravděpodobně víc.' },
  79: { percent: 0.0000001, note: 'Na povrchu extrémně vzácné; značná část zlata skončila v jádře.' },
  80: { percent: 0.000001, note: 'Ultra-stopově v rudách a sulfidech.' },
  81: { percent: 0.00000035, note: 'Velmi vzácně v rudách a sulfidech.' },
  82: { percent: 0.000015, note: 'Stopově v rudách a minerálech.' },
  83: { percent: 0.0000003, note: 'Velmi vzácně v rudách, často jako příměs olova.' },
  84: { percent: 0, note: 'Jen stopově jako produkt rozpadu uranu a thoria.' },
  85: { percent: 0, note: 'V přírodě prakticky jen desítky gramů najednou; procento nemá smysl.' },
  86: { percent: 0, note: 'Vzácný radioaktivní plyn vznikající rozpadem radia.' },
  87: { percent: 0, note: 'Na celé Zemi jen desítky gramů v rovnováze rozpadu.' },
  88: { percent: 0, note: 'Jen stopově jako produkt rozpadu uranu a thoria.' },
  89: { percent: 0, note: 'Jen stopově jako produkt rozpadu uranu a thoria.' },
  90: { percent: 0.000008, note: 'Velmi vzácně v minerálech, ale důležitý zdroj radioaktivního tepla.' },
  91: { percent: 0, note: 'Jen stopově v rozpadových řadách; procento prakticky nula.' },
  92: { percent: 0.000002, note: 'Ultra-stopově v rudách, ale klíčový pro radioaktivní teplo a jadernou energetiku.' },
  93: { percent: 0, note: 'Jen stopově jako produkt rozpadu a v jaderných reakcích.' },
  94: { percent: 0, note: 'V přírodě jen mikroskopické stopy z rozpadových procesů.' },
  95: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  96: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  97: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  98: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  99: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  100: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  101: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  102: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  103: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  104: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  105: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  106: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  107: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  108: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  109: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  110: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  111: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  112: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  113: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  114: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  115: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  116: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  117: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
  118: { percent: 0, note: 'Čistě umělý prvek; přirozeně na Zemi 0 %.' },
}

export function earthAbundancePercentForZ(z: number): EarthAbundancePercent {
  return EARTH_ABUNDANCE[z]?.percent ?? 0
}

export function earthAbundanceNoteForElement(
  element: Pick<ChemicalElement, 'z' | 'symbol' | 'nameCs'>,
): string {
  const entry = EARTH_ABUNDANCE[element.z]
  if (entry) return entry.note
  return `${element.symbol} — ${element.nameCs}: V celé Zemi jen prakticky nulové nebo neměřitelně malé množství.`
}

export function formatEarthAbundancePercentCs(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 %'
  if (n >= 1) {
    return `${new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n)} %`
  }
  return `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(n)} %`
}
