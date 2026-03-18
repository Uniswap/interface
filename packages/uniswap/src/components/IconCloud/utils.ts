export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChoice<T>(choices: T[]): T {
  // biome-ignore lint/style/noNonNullAssertion: array access is safe here
  return choices[Math.floor(Math.random() * choices.length)]!
}

export function shuffleArray(array: unknown[]): unknown[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
