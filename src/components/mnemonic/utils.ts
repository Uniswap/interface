import { shuffled } from 'ethers/lib/utils'

export function getRandomIndices(arr: Array<any>, num: number) {
  return shuffled(arr.map((_, i) => i))
    .slice(0, num)
    .sort()
}
