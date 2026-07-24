// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import {
  Experiments,
  SwapConfirmationProperties,
  useExperiment as useStatsigExperiment,
  useExperimentValue as useGatingExperimentValue,
} from '@universe/gating'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type ExperimentsClient, createExperimentsClient } from '../client'
import { ExperimentsProvider } from '../react/ExperimentsProvider'
import { useExperimentValue } from './useExperimentValue'

vi.mock('@universe/gating', () => ({
  Experiments: { SwapConfirmation: 'swap-confirmation' },
  SwapConfirmationProperties: { WaitTimes: 'wait_times' },
  useExperiment: vi.fn(),
  useExperimentValue: vi.fn(),
}))

const mockStatsigExperiment = vi.mocked(useStatsigExperiment)
const mockGatingValue = vi.mocked(useGatingExperimentValue)

function makeWrapper(client: ExperimentsClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <ExperimentsProvider client={client}>{children}</ExperimentsProvider>
  }
}

function stubStatsig(override: { groupName: string | null; value: Record<string, unknown> }): void {
  mockStatsigExperiment.mockReturnValue(override as unknown as ReturnType<typeof useStatsigExperiment>)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useExperimentValue (bridge)', () => {
  it('returns the gating value unchanged', () => {
    mockGatingValue.mockReturnValue(30)
    stubStatsig({ groupName: 'treatment', value: { wait_times: 30 } })
    const client = createExperimentsClient()

    const { result } = renderHook(
      () =>
        useExperimentValue({
          experiment: Experiments.SwapConfirmation,
          param: SwapConfirmationProperties.WaitTimes,
          defaultValue: 0,
        }),
      { wrapper: makeWrapper(client) },
    )

    expect(result.current).toBe(30)
  })

  it('does not contribute to the active set when propagate is false', () => {
    mockGatingValue.mockReturnValue(30)
    stubStatsig({ groupName: 'treatment', value: { wait_times: 30 } })
    const client = createExperimentsClient()

    renderHook(
      () =>
        useExperimentValue({
          experiment: Experiments.SwapConfirmation,
          param: SwapConfirmationProperties.WaitTimes,
          defaultValue: 0,
        }),
      { wrapper: makeWrapper(client) },
    )

    expect(client.snapshot()).toEqual({})
  })

  it('does not contribute a placeholder bucket before Statsig resolves (groupName null)', () => {
    mockGatingValue.mockReturnValue(0)
    stubStatsig({ groupName: null, value: {} })
    const client = createExperimentsClient()

    renderHook(
      () =>
        useExperimentValue({
          experiment: Experiments.SwapConfirmation,
          param: SwapConfirmationProperties.WaitTimes,
          defaultValue: 0,
          propagate: true,
        }),
      { wrapper: makeWrapper(client) },
    )

    expect(client.snapshot()).toEqual({})
  })

  it('contributes the real bucket once Statsig resolves, not the earlier placeholder', () => {
    mockGatingValue.mockReturnValue(0)
    stubStatsig({ groupName: null, value: {} })
    const client = createExperimentsClient()

    const { rerender } = renderHook(
      () =>
        useExperimentValue({
          experiment: Experiments.SwapConfirmation,
          param: SwapConfirmationProperties.WaitTimes,
          defaultValue: 0,
          propagate: true,
        }),
      { wrapper: makeWrapper(client) },
    )

    expect(client.snapshot()).toEqual({})

    // Statsig buckets the user on a later render — first-write-wins must capture this, not the placeholder.
    stubStatsig({ groupName: 'treatment', value: { wait_times: 30 } })
    rerender()

    expect(client.get('swap-confirmation')).toEqual({
      groupName: 'treatment',
      value: { wait_times: 30 },
    })
  })

  it('contributes the full group + value map when propagate is true', () => {
    mockGatingValue.mockReturnValue(30)
    stubStatsig({ groupName: 'treatment', value: { wait_times: 30, other_param: 'x' } })
    const client = createExperimentsClient()

    renderHook(
      () =>
        useExperimentValue({
          experiment: Experiments.SwapConfirmation,
          param: SwapConfirmationProperties.WaitTimes,
          defaultValue: 0,
          propagate: true,
        }),
      { wrapper: makeWrapper(client) },
    )

    expect(client.get('swap-confirmation')).toEqual({
      groupName: 'treatment',
      value: { wait_times: 30, other_param: 'x' },
    })
  })
})
