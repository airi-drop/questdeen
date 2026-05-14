export function xpForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1)

  return Math.floor(100 * (safeLevel - 1) ** 1.65)
}

export function getLevelFromXP(xp) {
  const safeXP = Math.max(0, Number(xp) || 0)
  let level = 1

  while (xpForLevel(level + 1) <= safeXP) {
    level += 1
  }

  return level
}
