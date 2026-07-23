import { describe, expect, it } from 'vitest'
import {
  getCarouselPageSize,
  getPageScrollTarget,
  getSnapIndex,
  getSnapPositions,
} from '~/pages/Explore/rwa/shelf/carouselSnapScroll'

const CARD_STEP = 283
const TWELVE_CARD_POSITIONS = Array.from({ length: 12 }, (_, index) => index * CARD_STEP)

describe('getSnapPositions', () => {
  it('maps child offsetLeft values', () => {
    expect(getSnapPositions([{ offsetLeft: 0 }, { offsetLeft: 283 }, { offsetLeft: 566 }])).toEqual([0, 283, 566])
  })
})

describe('getSnapIndex', () => {
  it('returns 0 at scroll start', () => {
    expect(getSnapIndex(TWELVE_CARD_POSITIONS, 0)).toBe(0)
  })

  it('returns nearest passed snap index', () => {
    expect(getSnapIndex(TWELVE_CARD_POSITIONS, 290)).toBe(1)
    expect(getSnapIndex(TWELVE_CARD_POSITIONS, 1132)).toBe(4)
  })
})

describe('getCarouselPageSize', () => {
  it('returns at least one visible card', () => {
    expect(getCarouselPageSize(1120, CARD_STEP)).toBe(3)
    expect(getCarouselPageSize(100, 0)).toBe(1)
  })
})

describe('getPageScrollTarget', () => {
  const maxScrollLeft = TWELVE_CARD_POSITIONS[11]

  it('advances by one full page from the start', () => {
    expect(
      getPageScrollTarget({
        positions: TWELVE_CARD_POSITIONS,
        scrollLeft: 0,
        direction: 'next',
        pageSize: 4,
        maxScrollLeft,
      }),
    ).toBe(TWELVE_CARD_POSITIONS[4])
  })

  it('continues paging forward through the shelf', () => {
    expect(
      getPageScrollTarget({
        positions: TWELVE_CARD_POSITIONS,
        scrollLeft: TWELVE_CARD_POSITIONS[4],
        direction: 'next',
        pageSize: 4,
        maxScrollLeft,
      }),
    ).toBe(TWELVE_CARD_POSITIONS[8])
  })

  it('clamps to the final snap position at the end', () => {
    expect(
      getPageScrollTarget({
        positions: TWELVE_CARD_POSITIONS,
        scrollLeft: TWELVE_CARD_POSITIONS[8],
        direction: 'next',
        pageSize: 4,
        maxScrollLeft,
      }),
    ).toBe(maxScrollLeft)
  })

  it('pages backward from a scrolled position', () => {
    expect(
      getPageScrollTarget({
        positions: TWELVE_CARD_POSITIONS,
        scrollLeft: TWELVE_CARD_POSITIONS[4],
        direction: 'prev',
        pageSize: 4,
        maxScrollLeft,
      }),
    ).toBe(0)
  })

  it('returns current scroll position when there are no children', () => {
    expect(
      getPageScrollTarget({
        positions: [],
        scrollLeft: 42,
        direction: 'next',
        pageSize: 4,
        maxScrollLeft: 0,
      }),
    ).toBe(42)
  })
})
