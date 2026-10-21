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

  it('defaults match the spec F16 matrix', () => {
    expect(DEFAULT_MARGIN_CHART_PREFS).toStrictEqual({
      showPosition: true,
      liqZone: true,
      breakEven: true,
      markers: true,
      summaryChip: true,
      previewLines: true,
      volume: false,
      chartStyle: 'candles',
    })
    // The store initializes from the same defaults.
    expect(useMarginChartPrefs.getState()).toMatchObject(DEFAULT_MARGIN_CHART_PREFS)
  })

  it('setChartPrefs partial-merges state and persists under the v1 key', () => {
    useMarginChartPrefs.getState().setChartPrefs({ volume: true, chartStyle: 'line' })

    const state = useMarginChartPrefs.getState()
    expect(state.volume).toBe(true)
    expect(state.chartStyle).toBe('line')
    // Untouched prefs keep their defaults (partial merge, not replace).
    expect(state.showPosition).toBe(true)

    // Persisted synchronously to localStorage under the versioned key.
    const stored = readStoredState()
    expect(stored.volume).toBe(true)
    expect(stored.chartStyle).toBe('line')
    expect(stored.showPosition).toBe(true)
  })

  it('drops unknown persisted keys on rehydrate (merge prunes; migrate never runs same-version)', async () => {
    // A v1 payload carrying a known override plus a foreign key from a hypothetical older build.
    seedStorage({ ...DEFAULT_MARGIN_CHART_PREFS, chartStyle: 'line', rogueKey: true })

    await useMarginChartPrefs.persist.rehydrate()

    const state = useMarginChartPrefs.getState()
    expect(state.chartStyle).toBe('line') // known key rehydrated
    expect('rogueKey' in state).toBe(false) // unknown key pruned — never lands on state
    expect(state.showPosition).toBe(true) // untouched default preserved
  })

  it('fills defaults for keys missing from a persisted payload', async () => {
    // Older-build payload predating some prefs — only a subset of keys present.
    seedStorage({ showPosition: false, chartStyle: 'line' })

    await useMarginChartPrefs.persist.rehydrate()

    const state = useMarginChartPrefs.getState()
    expect(state.showPosition).toBe(false) // persisted override honored
    expect(state.chartStyle).toBe('line')
    expect(state.volume).toBe(false) // absent → default
    expect(state.markers).toBe(true) // absent → default
  })

  it('drops known keys whose persisted value type mismatches, falling back to defaults', async () => {
    seedStorage({ ...DEFAULT_MARGIN_CHART_PREFS, chartStyle: 42, volume: 'yes', showPosition: false })

    await useMarginChartPrefs.persist.rehydrate()

    const state = useMarginChartPrefs.getState()
    expect(state.chartStyle).toBe('candles') // number 42 rejected → default
    expect(state.volume).toBe(false) // string 'yes' rejected → default
    expect(state.showPosition).toBe(false) // valid boolean override honored
  })
})
