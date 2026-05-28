import { TFunction } from 'i18next'
import { adjustItemWidths } from '~/components/PercentageAllocationChart/chartUtils'
import type { AdjustedChartItem, PercentageAllocationItem } from '~/components/PercentageAllocationChart/types'

const mockT = ((key: string) => (key === 'common.others' ? 'Others' : '')) as TFunction

function makeItem(
  overrides: Partial<PercentageAllocationItem> & { id: string; percentage: number },
): PercentageAllocationItem {
  return {
    color: '#000',
    label: overrides.id,
    ...overrides,
  }
}

/** Total pixel width if segments were laid out in a container of chartWidth (percentages resolve against container). */
function totalPixelWidth(result: AdjustedChartItem[], chartWidth: number): number {
  return result.reduce((sum, item) => {
    const w = item.style.width
    if (w.endsWith('px')) {
      return sum + Number.parseFloat(w)
    }
    const pct = Number.parseFloat(w)
    return sum + (pct / 100) * chartWidth
  }, 0)
}

describe('adjustItemWidths', () => {
  it('returns empty array when items is empty', () => {
    expect(adjustItemWidths({ t: mockT, items: [], chartWidth: 100, minBarWidth: 8 })).toEqual([])
  })

  it('when chartWidth is undefined, returns items with percentage-based width and flexShrink 1', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'a', percentage: 60 }),
      makeItem({ id: 'b', percentage: 40 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: undefined, minBarWidth: 8 })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'a', style: { width: '60%', flexShrink: 1 } })
    expect(result[1]).toMatchObject({ id: 'b', style: { width: '40%', flexShrink: 1 } })
  })

  it('sorts items by percentage descending', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'low', percentage: 10 }),
      makeItem({ id: 'high', percentage: 90 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: 200, minBarWidth: 8 })

    expect(result[0].id).toBe('high')
    expect(result[1].id).toBe('low')
  })

  it('keeps aggregate "other" last even when it is the largest segment', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'other', percentage: 60, label: 'Others' }),
      makeItem({ id: 'chain-a', percentage: 25 }),
      makeItem({ id: 'chain-b', percentage: 15 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: 300, minBarWidth: 8 })

    expect(result.map((r) => r.id)).toEqual(['chain-a', 'chain-b', 'other'])
  })

  it('does not mutate the input items array', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'b', percentage: 40 }),
      makeItem({ id: 'a', percentage: 60 }),
    ]
    const copy = [...items]
    adjustItemWidths({ t: mockT, items, chartWidth: 200, minBarWidth: 8 })

    expect(items).toEqual(copy)
  })

  it('assigns small segments min width (8px) and flexShrink 0', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'big', percentage: 90 }),
      makeItem({ id: 'tiny', percentage: 0.5 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: 500, minBarWidth: 8 })

    const tiny = result.find((r) => r.id === 'tiny')
    expect(tiny?.style).toEqual({ width: '8px', flexShrink: 0 })
  })

  it('keeps total segment width within container when many small (8px) segments exist', () => {
    const chartWidth = 400
    const minBarWidth = 8
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'large', percentage: 70 }),
      makeItem({ id: 's1', percentage: 0.5 }),
      makeItem({ id: 's2', percentage: 0.5 }),
      makeItem({ id: 's3', percentage: 0.5 }),
      makeItem({ id: 's4', percentage: 0.5 }),
      makeItem({ id: 's5', percentage: 0.5 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth, minBarWidth })

    const total = totalPixelWidth(result, chartWidth)
    expect(total).toBeLessThanOrEqual(chartWidth)
  })

  it('assigns large segments proportional width and flexShrink 1', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'a', percentage: 70 }),
      makeItem({ id: 'b', percentage: 30 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: 300, minBarWidth: 8 })

    expect(result).toHaveLength(2)
    expect(result[0].style.flexShrink).toBe(1)
    expect(result[1].style.flexShrink).toBe(1)
    expect(result[0].style.width).toMatch(/%$/)
    expect(result[1].style.width).toMatch(/%$/)
  })

  it('groups more than 4 small items into an "others" segment', () => {
    const items: PercentageAllocationItem[] = [
      makeItem({ id: 'a', percentage: 50 }),
      makeItem({ id: 'b', percentage: 1 }),
      makeItem({ id: 'c', percentage: 1 }),
      makeItem({ id: 'd', percentage: 1 }),
      makeItem({ id: 'e', percentage: 1 }),
      makeItem({ id: 'f', percentage: 1 }),
    ]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: 400, minBarWidth: 8 })

    const others = result.find((r) => r.id === 'others')
    expect(others).toBeDefined()
    expect(others?.percentage).toBe(1) // 5th small item (1%) grouped into "others"
    expect(others?.label).toBe('Others')
    // One large (50%), four visible small (1% each), one "others" (1%)
    expect(result).toHaveLength(6)
    expect(result[result.length - 1].id).toBe('others')
  })

  it('preserves item id, percentage, color, and label on each result', () => {
    const items: PercentageAllocationItem[] = [makeItem({ id: 'x', percentage: 100, color: '#abc', label: 'X Label' })]
    const result = adjustItemWidths({ t: mockT, items, chartWidth: undefined, minBarWidth: 8 })

    expect(result[0]).toMatchObject({
      id: 'x',
      percentage: 100,
      color: '#abc',
      label: 'X Label',
      style: { width: '100%', flexShrink: 1 },
    })
  })
})
