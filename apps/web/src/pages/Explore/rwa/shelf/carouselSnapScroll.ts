export const SCROLL_EDGE_TOLERANCE_PX = 2

export function getSnapPositions(children: readonly { offsetLeft: number }[]): number[] {
  return children.map((child) => child.offsetLeft)
}

export function getSnapPositionsFromScroller(el: HTMLElement): number[] {
  return getSnapPositions(Array.from(el.children) as HTMLElement[])
}

export function getSnapIndex(positions: readonly number[], scrollLeft: number): number {
  if (positions.length === 0) {
    return 0
  }

  let index = 0
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] <= scrollLeft + SCROLL_EDGE_TOLERANCE_PX) {
      index = i
    } else {
      break
    }
  }

  return index
}

export function getCarouselPageSize(clientWidth: number, cardStep: number): number {
  if (cardStep <= 0) {
    return 1
  }

  return Math.max(1, Math.floor(clientWidth / cardStep))
}

export function getPageScrollTarget({
  positions,
  scrollLeft,
  direction,
  pageSize,
  maxScrollLeft,
}: {
  positions: readonly number[]
  scrollLeft: number
  direction: 'next' | 'prev'
  pageSize: number
  maxScrollLeft: number
}): number {
  if (positions.length === 0) {
    return scrollLeft
  }

  const currentIndex = getSnapIndex(positions, scrollLeft)

  if (direction === 'next') {
    const targetIndex = Math.min(currentIndex + pageSize, positions.length - 1)
    return Math.min(positions[targetIndex], maxScrollLeft)
  }

  const targetIndex = Math.max(currentIndex - pageSize, 0)
  return positions[targetIndex]
}
