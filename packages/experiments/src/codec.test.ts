import { describe, expect, it } from 'vitest'
import { EXPERIMENTS_HEADER_NAME, parseExperimentsHeader, serializeExperimentsHeader } from './codec'
import type { ExperimentsMap } from './types'

describe('codec', () => {
  it('uses the header name the backend reads', () => {
    expect(EXPERIMENTS_HEADER_NAME).toBe('x-experiments')
  })

  describe('serializeExperimentsHeader', () => {
    it('produces the backend-compatible JSON shape', () => {
      const map: ExperimentsMap = {
        checkout_flow_v2: { groupName: 'treatment', value: { buttonColor: 'green', showProgress: true } },
        fee_tier_experiment: { value: { defaultFee: 500 } },
      }
      expect(serializeExperimentsHeader(map)).toBe(
        '{"checkout_flow_v2":{"groupName":"treatment","value":{"buttonColor":"green","showProgress":true}},"fee_tier_experiment":{"value":{"defaultFee":500}}}',
      )
    })

    it('round-trips through parse', () => {
      const map: ExperimentsMap = { exp_a: { groupName: 'control', value: { x: 1 } } }
      expect(parseExperimentsHeader(serializeExperimentsHeader(map))).toEqual(map)
    })
  })

  describe('parseExperimentsHeader', () => {
    it('parses a valid payload', () => {
      expect(parseExperimentsHeader('{"exp":{"groupName":"treatment","value":{"a":1}}}')).toEqual({
        exp: { groupName: 'treatment', value: { a: 1 } },
      })
    })

    it.each([
      ['null/undefined', undefined],
      ['empty string', ''],
      ['invalid JSON', '{not json'],
      ['a JSON array', '[1,2,3]'],
      ['a JSON primitive', '42'],
      ['JSON null', 'null'],
    ])('returns an empty map for %s', (_label, input) => {
      expect(parseExperimentsHeader(input as string | undefined)).toEqual({})
    })
  })
})
