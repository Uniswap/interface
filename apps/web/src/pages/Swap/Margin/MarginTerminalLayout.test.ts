import { describe, expect, it } from 'vitest'
import {
  clampMarginChartBlockHeight,
  defaultMarginChartBlockHeight,
  isMarginTerminalReady,
  marginTableMaxHeight,
  MARGIN_CHART_BLOCK_MIN_HEIGHT,
  resolveMarginChartBlockHeights,
} from '~/pages/Swap/Margin/MarginTerminalLayout'

// Pane chrome (106) + gap (12) + whole 72px rows with 2px gaps between them.
const tablePane = (rows: number): number => 106 + rows * 72 + (rows - 1) * 2

describe('defaultMarginChartBlockHeight', () => {
  it('budgets three whole table rows before the pane content is measured', () => {
    expect(defaultMarginChartBlockHeight({ columnHeight: 800 })).toBe(800 - 12 - tablePane(3))
  })

  it('caps the positions pane at four rows on a tall column, so the chart takes the rest', () => {
    expect(defaultMarginChartBlockHeight({ columnHeight: 2000 })).toBe(2000 - 12 - tablePane(4))
  })

  it('sizes the pane to its content, so one position leaves the chart the rest of the column', () => {
    expect(defaultMarginChartBlockHeight({ columnHeight: 800, paneContentHeight: tablePane(1) })).toBe(
      800 - 12 - tablePane(1),
    )
  })

  it('caps a taller pane content at the row budget, past which the pane scrolls', () => {
    expect(defaultMarginChartBlockHeight({ columnHeight: 800, paneContentHeight: tablePane(9) })).toBe(
      800 - 12 - tablePane(3),
    )
  })

  it('never shrinks the chart block below its floor on a short column', () => {
    expect(defaultMarginChartBlockHeight({ columnHeight: 500 })).toBe(MARGIN_CHART_BLOCK_MIN_HEIGHT)
  })
})

describe('clampMarginChartBlockHeight', () => {
  it('passes a drag through inside the bounds', () => {
    expect(clampMarginChartBlockHeight({ columnHeight: 800, wanted: 450 })).toBe(450)
  })

  it('keeps one positions row when dragged down', () => {
    expect(clampMarginChartBlockHeight({ columnHeight: 800, wanted: 790 })).toBe(800 - 12 - tablePane(1))
  })

  it('keeps the chart floor when dragged up, even on a column too short for both', () => {
    expect(clampMarginChartBlockHeight({ columnHeight: 800, wanted: 10 })).toBe(MARGIN_CHART_BLOCK_MIN_HEIGHT)
    expect(clampMarginChartBlockHeight({ columnHeight: 300, wanted: 500 })).toBe(MARGIN_CHART_BLOCK_MIN_HEIGHT)
  })
})

describe('resolveMarginChartBlockHeights', () => {
  const base = { hasPositionsPane: true, rowHeight: 800, chartBlockOverride: undefined }

  it('leaves the block on flex until the pane is measured, with no saved drag', () => {
    expect(resolveMarginChartBlockHeights({ ...base, paneContentHeight: undefined })).toEqual({
      height: undefined,
      split: undefined,
    })
  })

  it('pins a saved drag before the pane is measured', () => {
    expect(resolveMarginChartBlockHeights({ ...base, chartBlockOverride: 500, paneContentHeight: undefined })).toEqual({
      height: 500,
      split: undefined,
    })
  })

  // A pane with many positions must scroll the column, not squeeze the chart below its floor.
  it('renders the block at the split the handle drags from, keeping the floor under a tall pane', () => {
    const { height, split } = resolveMarginChartBlockHeights({ ...base, rowHeight: 600, paneContentHeight: 900 })
    expect(height).toBe(split)
    expect(height).toBe(MARGIN_CHART_BLOCK_MIN_HEIGHT)
  })
})

describe('marginTableMaxHeight', () => {
  // A column of rows under the 106px pane chrome, plus the app header that Table subtracts back out.
  it('budgets the body at the column height less the pane chrome', () => {
    expect(marginTableMaxHeight({ columnHeight: 800, appHeaderHeight: 72 })).toBe(72 + 800 - 106)
  })

  it('is undefined until the column is measured', () => {
    expect(marginTableMaxHeight({ columnHeight: 0, appHeaderHeight: 72 })).toBeUndefined()
  })
})

describe('isMarginTerminalReady', () => {
  const READY = { flagLoading: false, isMarginEnabled: true, chunksLoaded: true, marketsLoading: false }

  it('opens once the markets query settles, whether it served markets, none, or an error', () => {
    expect(isMarginTerminalReady(READY)).toBe(true)
  })

  it.each([
    ['the flag is loading', { flagLoading: true }],
    ['the flag is off', { isMarginEnabled: false }],
    ['a chunk is still loading', { chunksLoaded: false }],
    ['the markets query is loading', { marketsLoading: true }],
  ] as const)('holds the blank while %s', (_, override) => {
    expect(isMarginTerminalReady({ ...READY, ...override })).toBe(false)
  })
})
