export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChoice<T>(choices: T[]): T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return choices[Math.floor(Math.random() * choices.length)]!
}

function shuffleArray(array: unknown[]): unknown[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export function mixArrays(arr1: unknown[], arr2: unknown[], ratio: number): unknown[] {
  const arr2TrimLength = Math.floor(arr1.length * ratio)
  const arr2Trimmed = arr2.slice(0, arr2TrimLength)

  return shuffleArray([...arr1, ...arr2Trimmed])
}
