export function isNegative(n: number) {
  return n < 0
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomChoice<T>(choices: T[]): T {
  return choices[Math.floor(Math.random() * choices.length)]
}

export function isInBounds(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2
}

function shuffleArray(array: any[]) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export function mixArrays(arr1: any[], arr2: any[], ratio: number) {
  const arr2TrimLength = Math.floor(arr1.length * ratio)
  const arr2Trimmed = arr2.slice(0, arr2TrimLength)

  return shuffleArray([...arr1, ...arr2Trimmed])
}
