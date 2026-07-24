import { describe, expect, it } from 'vitest'
import { createExperimentsClient } from './client'
import { MOCK_EXPERIMENT_KEY, requestMockScenario } from './mock'

describe('requestMockScenario', () => {
  it('writes the reserved directive so it rides the x-experiments header', () => {
    const client = createExperimentsClient()
    requestMockScenario({ scenario: 'echo', args: { n: 1 } }, client)

    expect(client.get(MOCK_EXPERIMENT_KEY)).toEqual({
      value: { scenario: 'echo', args: { n: 1 } },
    })
    expect(client.toHeaders()).toEqual({
      'x-experiments': JSON.stringify({
        [MOCK_EXPERIMENT_KEY]: { value: { scenario: 'echo', args: { n: 1 } } },
      }),
    })
  })

  it('omits args when none are given', () => {
    const client = createExperimentsClient()
    requestMockScenario({ scenario: 'cannedQuote' }, client)

    expect(client.get(MOCK_EXPERIMENT_KEY)).toEqual({
      value: { scenario: 'cannedQuote' },
    })
  })

  it('uses the reserved __mock__ key', () => {
    expect(MOCK_EXPERIMENT_KEY).toBe('__mock__')
  })
})
