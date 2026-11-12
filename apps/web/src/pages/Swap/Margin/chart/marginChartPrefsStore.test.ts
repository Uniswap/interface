import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_MARGIN_CHART_PREFS, useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'

const STORAGE_KEY = 'margin.chartPrefs.v1'

// Persist stores the zustand envelope { state, version }. Seed it directly to exercise rehydrate.
function seedStorage(state: Record<string, unknown>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 1 }))
}

function readStoredState(): Record<string, unknown> {
  const raw = localStorage.getItem(STORAGE_KEY)
  expect(raw).not.toBeNull()
  return (JSON.parse(raw as string) as { state: Record<string, unknown> }).state
}

describe('marginChartPrefsStore', () => {
  beforeEach(() => {
    // Singleton store: reset to defaults, then wipe storage so each test starts clean.
    useMarginChartPrefs.setState({ ...DEFAULT_MARGIN_CHART_PREFS })
    localStorage.clear()
  })

  it('defaults to candles', () => {
    expect(DEFAULT_MARGIN_CHART_PREFS).toStrictEqual({ chartStyle: 'candles' })
    expect(useMarginChartPrefs.getState()).toMatchObject(DEFAULT_MARGIN_CHART_PREFS)
  })

  it('setChartPrefs updates state and persists under the v1 key', () => {
    useMarginChartPrefs.getState().setChartPrefs({ chartStyle: 'line' })

    expect(useMarginChartPrefs.getState().chartStyle).toBe('line')
    expect(readStoredState().chartStyle).toBe('line')
  })

  it('drops the removed overlay and volume prefs from an older payload on rehydrate', async () => {
    seedStorage({
      chartStyle: 'line',
      showPosition: false,
      liqZone: true,
      breakEven: true,
      markers: true,
      summaryChip: true,
      previewLines: false,
      volume: true,
    })

    await useMarginChartPrefs.persist.rehydrate()

    const state = useMarginChartPrefs.getState()
    expect(state.chartStyle).toBe('line')
    for (const key of ['showPosition', 'liqZone', 'breakEven', 'markers', 'summaryChip', 'previewLines', 'volume']) {
      expect(key in state).toBe(false)
    }
  })

  it('falls back to the default for a mistyped persisted chart style', async () => {
    seedStorage({ chartStyle: 42 })

    await useMarginChartPrefs.persist.rehydrate()

    expect(useMarginChartPrefs.getState().chartStyle).toBe('candles')
  })
})
