export const calculateCardIndex = (x: number, l: number) => {
  return (x < 0 ? x + l : x) % l
}

export const calculateFirstCardIndex = (
  i: number,
  firstVis: number,
  firstVisIdx: number,
  idx: (x: number, l?: number) => number
) => {
  return idx(i - firstVis + firstVisIdx)
}

export const calculateRank = (firstVis: number, firstVisIdx: number, position: number, l: number, y: number) => {
  return firstVis - (y < 0 ? l : 0) + position - firstVisIdx + (y < 0 && firstVis === 0 ? l : 0)
}
