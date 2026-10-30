import {
  applyGatingUrlOverrides,
  type GatingOverrideTarget,
  parseGatingUrlOverrides,
} from '@universe/gating/src/urlOverrides'
import { describe, expect, it } from 'vitest'

type Call = [method: keyof GatingOverrideTarget, name: string, value: unknown]

function recordingTarget(): { target: GatingOverrideTarget; calls: Call[] } {
  const calls: Call[] = []
  const target: GatingOverrideTarget = {
    overrideGate: (name, value) => calls.push(['overrideGate', name, value]),
    overrideDynamicConfig: (name, value) => calls.push(['overrideDynamicConfig', name, value]),
    overrideExperiment: (name, value) => calls.push(['overrideExperiment', name, value]),
    overrideLayer: (name, value) => calls.push(['overrideLayer', name, value]),
  }
  return { target, calls }
}

describe('parseGatingUrlOverrides', () => {
  it('returns no overrides for an empty query', () => {
    const parsed = parseGatingUrlOverrides({})
    expect(parsed).toEqual({ gates: [], experimentGroups: [], experimentParams: [], layers: [] })
  })

  it('reads comma-separated gates on and off', () => {
    const parsed = parseGatingUrlOverrides({ featureFlagOverride: 'a,b', featureFlagOverrideOff: 'c' })
    expect(parsed.gates).toEqual([
      { name: 'a', value: true },
      { name: 'b', value: true },
      { name: 'c', value: false },
    ])
  })

  it('drops blank entries and surrounding whitespace', () => {
    expect(parseGatingUrlOverrides({ featureFlagOverride: ' a, ,b,' }).gates).toEqual([
      { name: 'a', value: true },
      { name: 'b', value: true },
    ])
    expect(parseGatingUrlOverrides({ featureFlagOverride: '' }).gates).toEqual([])
  })

  it('ignores a repeated param (array value) and non-string values', () => {
    expect(parseGatingUrlOverrides({ featureFlagOverride: ['a', 'b'] }).gates).toEqual([])
    expect(parseGatingUrlOverrides({ featureFlagOverrideOff: { nested: true } }).gates).toEqual([])
  })

  describe('from URLSearchParams', () => {
    it('reads nothing from an empty or unrelated query', () => {
      expect(parseGatingUrlOverrides(new URLSearchParams(''))).toEqual({
        gates: [],
        experimentGroups: [],
        experimentParams: [],
        layers: [],
      })
      expect(parseGatingUrlOverrides(new URLSearchParams('?tab=launches')).gates).toEqual([])
    })

    it('reads the same params as the qs shape, with or without the leading ?', () => {
      const expected = [
        { name: 'gate_a', value: true },
        { name: 'gate_b', value: true },
        { name: 'gate_c', value: false },
      ]
      const query = 'featureFlagOverride=gate_a,gate_b&featureFlagOverrideOff=gate_c'
      expect(parseGatingUrlOverrides(new URLSearchParams(`?${query}`)).gates).toEqual(expected)
      expect(parseGatingUrlOverrides(new URLSearchParams(query)).gates).toEqual(expected)
      expect(parseGatingUrlOverrides(Object.fromEntries(new URLSearchParams(query))).gates).toEqual(expected)
    })

    it('decodes percent-encoded separators', () => {
      const parsed = parseGatingUrlOverrides(
        new URLSearchParams('?featureFlagOverride=gate_a%2Cgate_b&experimentOverride=exp%3Atest'),
      )
      expect(parsed.gates.map((gate) => gate.name)).toEqual(['gate_a', 'gate_b'])
      expect(parsed.experimentGroups).toEqual([{ name: 'exp', group: 'test' }])
    })

    it('ignores a repeated param, as the qs shape does', () => {
      const parsed = parseGatingUrlOverrides(
        new URLSearchParams('?featureFlagOverride=gate_a&featureFlagOverride=gate_b&layerOverride=l:p'),
      )
      expect(parsed.gates).toEqual([])
      expect(parsed.layers).toEqual([{ name: 'l', param: 'p', value: true }])
    })
  })

  it('splits experiment entries into group and param overrides', () => {
    const parsed = parseGatingUrlOverrides({
      experimentOverride: 'exp_a:test,exp_b:enabled:true,exp_c:count:3,exp_d:label:hello,exp_e:url:https://x.y/z',
    })
    expect(parsed.experimentGroups).toEqual([{ name: 'exp_a', group: 'test' }])
    expect(parsed.experimentParams).toEqual([
      { name: 'exp_b', param: 'enabled', value: true },
      { name: 'exp_c', param: 'count', value: 3 },
      { name: 'exp_d', param: 'label', value: 'hello' },
      { name: 'exp_e', param: 'url', value: 'https://x.y/z' },
    ])
  })

  it('skips experiment and layer entries missing their second segment', () => {
    const parsed = parseGatingUrlOverrides({ experimentOverride: 'lonely,:group', layerOverride: 'layer_only' })
    expect(parsed.experimentGroups).toEqual([])
    expect(parsed.experimentParams).toEqual([])
    expect(parsed.layers).toEqual([])
  })

  it('reads layer params on and off', () => {
    const parsed = parseGatingUrlOverrides({ layerOverride: 'swap:new_ui', layerOverrideOff: 'swap:old_ui' })
    expect(parsed.layers).toEqual([
      { name: 'swap', param: 'new_ui', value: true },
      { name: 'swap', param: 'old_ui', value: false },
    ])
  })
})

describe('applyGatingUrlOverrides', () => {
  it('writes each override through the matching adapter method', () => {
    const { target, calls } = recordingTarget()
    applyGatingUrlOverrides(
      parseGatingUrlOverrides({
        featureFlagOverride: 'on_gate',
        featureFlagOverrideOff: 'off_gate',
        experimentOverride: 'exp_a:test,exp_b:enabled:false',
        layerOverride: 'layer_a:param_on',
        layerOverrideOff: 'layer_b:param_off',
      }),
      target,
    )
    expect(calls).toEqual([
      ['overrideGate', 'on_gate', true],
      ['overrideGate', 'off_gate', false],
      ['overrideDynamicConfig', 'exp_a', { group: 'test' }],
      ['overrideExperiment', 'exp_b', { enabled: false }],
      ['overrideLayer', 'layer_a', { param_on: true }],
      ['overrideLayer', 'layer_b', { param_off: false }],
    ])
  })

  it('merges every param for one layer or experiment into a single call, since the adapter assigns per name', () => {
    const { target, calls } = recordingTarget()
    applyGatingUrlOverrides(
      parseGatingUrlOverrides({
        experimentOverride: 'exp:enabled:true,exp:count:3,other:label:x',
        layerOverride: 'swap:new_ui,swap:beta_badge',
        layerOverrideOff: 'swap:old_ui',
      }),
      target,
    )
    expect(calls).toEqual([
      ['overrideExperiment', 'exp', { enabled: true, count: 3 }],
      ['overrideExperiment', 'other', { label: 'x' }],
      ['overrideLayer', 'swap', { new_ui: true, beta_badge: true, old_ui: false }],
    ])
  })

  it('is a no-op for an empty query', () => {
    const { target, calls } = recordingTarget()
    applyGatingUrlOverrides(parseGatingUrlOverrides({}), target)
    expect(calls).toEqual([])
  })
})
