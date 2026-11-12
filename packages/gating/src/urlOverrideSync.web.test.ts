import { LocalOverrideAdapter } from '@statsig/js-local-overrides'
import { getOverrideAdapter } from '@universe/gating/src/sdk/statsig'
import {
  clearGatingUrlParams,
  getUrlWithGateOverrides,
  overrideGateWithUrlSync,
} from '@universe/gating/src/urlOverrideSync.web'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@universe/gating/src/sdk/statsig', () => ({ getOverrideAdapter: vi.fn() }))

describe('urlOverrideSync', () => {
  const writeSearch = vi.fn<(search: string) => void>()

  beforeEach(() => {
    const adapter = new LocalOverrideAdapter()
    vi.mocked(getOverrideAdapter).mockReturnValue(adapter as unknown as ReturnType<typeof getOverrideAdapter>)
    writeSearch.mockReset()
    window.history.replaceState(null, '', '/swap')
  })

  it('writes the first gate override for a URL with no query string', () => {
    overrideGateWithUrlSync({ name: 'gate_a', value: true, writeSearch })

    expect(writeSearch).toHaveBeenCalledWith('?featureFlagOverride=gate_a')
    expect(getOverrideAdapter().getAllOverrides().gate).toMatchObject({ gate_a: true })
  })

  it('lists every gate override with literal commas and keeps other params', () => {
    window.history.replaceState(null, '', '/swap?chain=base')
    getOverrideAdapter().overrideGate('gate_a', true)
    getOverrideAdapter().overrideGate('gate_b', true)

    overrideGateWithUrlSync({ name: 'gate_c', value: false, writeSearch })

    expect(writeSearch).toHaveBeenCalledWith(
      '?chain=base&featureFlagOverride=gate_a,gate_b&featureFlagOverrideOff=gate_c',
    )
  })

  it('writes the query without any gating param on clear', () => {
    window.history.replaceState(null, '', '/swap?chain=base&featureFlagOverride=gate_a&experimentOverride=exp:test')

    clearGatingUrlParams(writeSearch)

    expect(writeSearch).toHaveBeenCalledWith('?chain=base')
  })

  it('writes an empty query once nothing else remains', () => {
    window.history.replaceState(null, '', '/swap?featureFlagOverride=gate_a')

    clearGatingUrlParams(writeSearch)

    expect(writeSearch).toHaveBeenCalledWith('')
  })

  it('builds the current URL with all active gate overrides without writing it', () => {
    window.history.replaceState(null, '', '/swap?chain=base#top')
    getOverrideAdapter().overrideGate('gate_a', true)
    getOverrideAdapter().overrideGate('gate_b', true)

    expect(getUrlWithGateOverrides()).toBe(
      `${window.location.origin}/swap?chain=base&featureFlagOverride=gate_a,gate_b#top`,
    )
    expect(window.location.search).toBe('?chain=base')
  })
})
