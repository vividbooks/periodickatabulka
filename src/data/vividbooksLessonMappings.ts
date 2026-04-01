import type { ChemicalElement } from './elements'

/**
 * Mapování prvku → ID lekcí Vividbooks napříč knihami 73, 82, 88, 91, 94, 97, 103.
 * (100 Chemie a bezpečnost záměrně ne — obecné lab. pravidlo neopakujeme u každého prvku.)
 *
 * Pracovní listy / lab. materiály se v UI berou z manifestu podle těchto ID automaticky.
 */

function isMetalCategory(c: ChemicalElement['category']): boolean {
  return (
    c === 'alkali-metal' ||
    c === 'alkaline-earth' ||
    c === 'transition' ||
    c === 'post-transition' ||
    c === 'lanthanide' ||
    c === 'actinide'
  )
}

export function collectVividbooksLessonIds(el: ChemicalElement): number[] {
  const { z, category } = el
  const primary: number[] = []
  const push = (id: number) => {
    if (!primary.includes(id)) primary.push(id)
  }

  const metal = isMetalCategory(category)

  /* ─── Kniha 73 · Atomy a prvky ─── */
  if (z === 1) push(1498)
  if (z === 6) push(1441)
  if (z === 7) {
    push(1402)
    push(1405)
    push(1408)
  }
  if (z === 8) push(1396)
  if (z === 15) push(1429)
  if (z === 16) push(1426)
  if (z === 26) push(1384)

  if (category === 'alkali-metal') push(1256)
  if (category === 'alkaline-earth') push(1232)
  if (category === 'halogen') push(1414)
  if (category === 'noble-gas') push(1423)
  if (category === 'metalloid') push(1411)

  if (category === 'nonmetal' || category === 'halogen') push(1390)
  if (category === 'metalloid') push(1390)

  /* ─── Kniha 82 · Chemické látky a směsi ─── */
  if (z === 1) {
    push(1621)
    push(1549)
  }
  if (z === 8) {
    push(1558)
    push(1621)
    push(1549)
    push(1555)
  }
  if (z === 7) {
    push(1558)
    push(1555)
  }
  if (z === 18) push(1558)
  if (z === 11 || z === 17) {
    push(1483)
    push(1528)
  }
  if (z === 6 || z === 16) push(1555)
  if (z === 12 || z === 20) push(1552)

  /* ─── Kniha 88 · Chemická vazba ─── */
  if (metal) {
    push(1564)
    push(1600)
  }
  if (category === 'halogen') {
    push(1600)
    push(1609)
  }
  if (category === 'nonmetal' || category === 'metalloid') {
    push(1609)
  }
  if (category === 'noble-gas') push(1597)
  if (z === 1) push(1609)

  /* ─── Kniha 91 · Chemické reakce ─── */
  if (metal) {
    push(1741)
    push(1735)
  }
  if ([26, 29, 13, 30, 50, 82].includes(z)) push(1753)
  if (z === 29) {
    push(1747)
    push(1759)
  }
  if (z === 11 || z === 17) push(1744)
  if ([30, 3, 12, 25, 47, 26].includes(z)) push(1768)

  /* ─── Kniha 94 · Anorganické sloučeniny ─── */
  if (z === 11) {
    push(1654)
    push(1714)
    push(1696)
    push(1681)
  }
  if (z === 17) {
    push(1654)
    push(1675)
  }
  if (z === 47 || z === 35) push(1666)
  if (z === 6) {
    push(1651)
    push(1669)
  }
  if (z === 7) {
    push(1648)
    push(1660)
    push(1696)
  }
  if (z === 16) {
    push(1642)
    push(1684)
  }
  if (z === 1) {
    push(1675)
    push(1669)
    push(1714)
  }
  if (z === 20) {
    push(1723)
    push(1690)
  }

  /* ─── Kniha 97 · Organické sloučeniny ─── */
  if (z === 6) {
    push(1750)
    push(1756)
    push(1762)
    push(1812)
    push(1816)
    push(1825)
    push(1820)
    push(1824)
    push(1826)
    push(1832)
  }
  if (z === 1) {
    push(1762)
    push(1756)
  }
  if (z === 8) push(1825)
  if (z === 7) {
    push(1832)
    push(1856)
  }

  /* ─── Kniha 103 · Chemie a společnost ─── */
  if (z === 26) push(1848)
  if (z === 6) {
    push(1795)
    push(1812)
    push(1853)
    push(1844)
  }
  if (z === 1) {
    push(1795)
    push(1812)
  }
  if (z === 17) push(1795)
  if (z === 7 || z === 16) push(1840)
  if (z === 20) push(1855)
  if (z === 8) push(1844)

  return primary
}
