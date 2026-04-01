import { SHELL_ELECTRONS_BY_ATOMIC_NUMBER } from './shellsFromPeriodicTableJson'
import type { ZsElementCoreFacts } from './zsElementCore'

const SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'] as const

/** Popis obsazení slupek jako „K: 2 · L: 8 …“ (terminologie ZŠ). */
export function formatShellsKlm(shells: readonly number[]): string {
  return shells
    .map((c, i) => `${SHELL_LETTERS[i] ?? String(i + 1)}: ${c}`)
    .join(' · ')
}

/** Krátká věta o valenčních elektronech v úrovni ZŠ. */
export function zsValencePopis(
  z: number,
  core: ZsElementCoreFacts,
): string {
  const shells = SHELL_ELECTRONS_BY_ATOMIC_NUMBER[z]
  if (!shells?.length) return '—'

  const outer = shells[shells.length - 1]
  const g = core.skupina

  if (g === 1 || g === 2) {
    return `Valenční slupka obsahuje ${outer} e⁻. Kovy mají tendenci elektron(y) odštěpit (vznikají kationty).`
  }
  if (g != null && g >= 13 && g <= 17) {
    return `Ve valenční slupce je ${outer} e⁻. U nekovů často elektron(y) přijímají nebo sdílejí (vazby, oktet později na ZŠ / SŠ).`
  }
  if (g === 18) {
    if (z === 2) {
      return 'Valenční vrstva je zaplněna 2 e⁻ (helium jako výjimka mezi vzácnými plyny).'
    }
    return 'Valenční vrstva je u těžších prvků skupiny obvykle zaplněna 8 e⁻ (máloreaktivní plyny).'
  }
  if (g != null && g >= 3 && g <= 12) {
    return 'Přechodný kov — na ZŠ jen základ: může vykazovat více oxidačních stavů; podrobnosti na SŠ.'
  }
  if (core.typLatkyZs.includes('lanthanoid')) {
    return 'Kov vzácných zemin; podrobné vlastnosti až na SŠ.'
  }
  if (core.typLatkyZs.includes('aktinoid')) {
    return 'Často radioaktivní prvky; chemie podrobně až na SŠ.'
  }
  return 'Elektronové uspořádání lze ilustrovat modelem slupek vedle.'
}

/** Jedna odstavcová poznámka vhodná jako „co říct ve škole“. */
export function zsPraktickaPoznamka(core: ZsElementCoreFacts): string {
  const t = core.typLatkyZs
  if (t.includes('alkalických zemin')) {
    return 'Reaktivní kovy; hoří např. v kyslíku. V praxi pozor na popáleniny a bezpečné pokusy jen pod dohledem.'
  }
  if (t.startsWith('alkalický kov')) {
    return 'Velmi reaktivní kovy; s vodou vzniká hydroxid a vodík. Ve škole se často ukazují vzorky uložené pod vazelínou nebo v oleji.'
  }
  if (t.includes('přechodný kov')) {
    return 'Tvrdé kovy, často dobré vodiče; řada z nich má širší uplatnění (např. železo, měď, zinek).'
  }
  if (t.includes('po přechodných')) {
    return 'Měkké kovy s nižším tepláním bodem; hliník, cín a podobné prvky znáš z výroby drátů nebo plechů.'
  }
  if (t.includes('polokov')) {
    return 'Vlastnosti mezi kovem a nekov — např. křemík v polovodičích (spíše odborná škola, ale jméno znáš).'
  }
  if (t === 'nekov' || t.includes('nekov')) {
    return 'Nekovy tvoří velké množství látek v přírodě a těle (uhlík, dusík, kyslík …).'
  }
  if (t.includes('halogen')) {
    return 'Vysoce reaktivní nekovy; s kovy tvoří soli (chlorid sodný znáš z tabule solí).'
  }
  if (t.includes('vzácný plyn')) {
    return 'Chemicky velmi stabilní plyny; použití např. v osvětlení nebo jako ochranná atmosféra (podle prvku).'
  }
  if (t.includes('lanthanoid')) {
    return 'Součást skupiny vzácných zemin; v běžné výuce ZŠ jen stručná zmínka, více v odborných předmětech.'
  }
  if (t.includes('aktinoid')) {
    return 'Mnohé izotopy jsou radioaktivní — v ZŠ hlavně principová zmínka, ne pokusy s otevřenými zdroji.'
  }
  return 'Základní částice znáš ze sloupečku a modelu; další vlastnosti podle učebnice a pokusů ve škole.'
}
