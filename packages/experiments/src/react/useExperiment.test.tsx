// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { type ExperimentsClient, createExperimentsClient } from '../client'
import { experiment } from '../experiment'
import { ExperimentsProvider } from './ExperimentsProvider'
import { useExperiment } from './useExperiment'

function makeWrapper(client: ExperimentsClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <ExperimentsProvider client={client}>{children}</ExperimentsProvider>
  }
}

describe('useExperiment', () => {
  it('returns undefined when the experiment is absent', () => {
    const client = createExperimentsClient()
    const { result } = renderHook(() => useExperiment('exp'), { wrapper: makeWrapper(client) })

    expect(result.current).toBeUndefined()
  })

  it('returns the override once present and re-renders when it changes', () => {
    const client = createExperimentsClient()
    const { result } = renderHook(() => useExperiment('exp'), { wrapper: makeWrapper(client) })

    expect(result.current).toBeUndefined()

    act(() => {
      client.set('exp', { groupName: 'treatment', value: { a: 1 } })
    })

    expect(result.current).toEqual({ groupName: 'treatment', value: { a: 1 } })
  })

  it('reads a typed definition by its name', () => {
    const client = createExperimentsClient()
    client.set('checkout_flow_v2', { groupName: 'treatment', value: { buttonColor: 'green' } })

    const checkoutFlow = experiment<{ buttonColor: string }>('checkout_flow_v2')
    const { result } = renderHook(() => useExperiment(checkoutFlow), { wrapper: makeWrapper(client) })

    expect(result.current?.value.buttonColor).toBe('green')
  })

  it('falls back to the shared singleton when no provider is present', () => {
    const { result } = renderHook(() => useExperiment('never-set-anywhere'))

    expect(result.current).toBeUndefined()
  })
})
