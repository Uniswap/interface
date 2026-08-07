export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChoice<T>(choices: T[]): T {
  // oxlint-disable-next-line typescript/no-non-null-assertion -- array access is safe here
  return choices[Math.floor(Math.random() * choices.length)]!
}

export function shuffleArray<T>(array: readonly T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // Indices are always in range; the casts undo noUncheckedIndexedAccess's `| undefined`.
    ;[newArray[i], newArray[j]] = [newArray[j] as T, newArray[i] as T]
  }
  return newArray
}
