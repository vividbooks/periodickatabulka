/** Stejná barevná škála jako u bodu tání — univerzální pro libovolnou škálu min…max. */

export function tileColorsForExploreScalar(
  value: number | null,
  scaleMin: number,
  scaleMax: number,
  palette: 'rainbow' | 'grayscale' = 'rainbow',
): {
  face: string
  rimTop: string
  rimBot: string
  ink: string
} {
  if (value == null || !Number.isFinite(value)) {
    return {
      face: 'hsl(218 14% 32%)',
      rimTop: 'hsl(218 16% 44%)',
      rimBot: 'hsl(218 18% 20%)',
      ink: '#eef3ff',
    }
  }
  const span = scaleMax - scaleMin
  const t =
    span > 0
      ? Math.max(0, Math.min(1, (value - scaleMin) / span))
      : 0.5
  if (palette === 'grayscale') {
    const faceL = 4 + t * 90
    const rimTopL = Math.min(98, faceL + 12)
    const rimBotL = Math.max(0, faceL - 16)
    const face = `hsl(0 0% ${faceL}%)`
    const rimTop = `hsl(0 0% ${rimTopL}%)`
    const rimBot = `hsl(0 0% ${rimBotL}%)`
    const ink = faceL > 58 ? '#0a1020' : '#f8fafc'
    return { face, rimTop, rimBot, ink }
  }
  const h = 235 * (1 - t) + 12 * t
  const s = 72
  const faceL = 34 + t * 15
  const face = `hsl(${h} ${s}% ${faceL}%)`
  const rimTop = `hsl(${h} ${Math.min(88, s + 10)}% ${Math.min(74, faceL + 24)}%)`
  const rimBot = `hsl(${h} ${s + 6}% ${Math.max(15, faceL - 22)}%)`
  const ink = faceL > 50 ? '#0a1020' : '#f8fafc'
  return { face, rimTop, rimBot, ink }
}
