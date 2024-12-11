export const calculateCardIndex = (x: number, l: number) => {
  return (x < 0 ? x + l : x) % l
}

export const calculateFirstCardIndex = (
  i: number,
  firstVis: number,
  firstVisIdx: number,
  idx: (x: number, l?: number) => number,
) => {
  return idx(i - firstVis + firstVisIdx)
}
