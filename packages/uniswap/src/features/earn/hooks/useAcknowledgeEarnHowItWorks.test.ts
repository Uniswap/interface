import { act } from '@testing-library/react'
import { initialUniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { useAcknowledgeEarnHowItWorks } from 'uniswap/src/features/earn/hooks/useAcknowledgeEarnHowItWorks'
import type { EarnAnalyticsBaseProperties } from 'uniswap/src/features/telemetry/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const mockLogEarnHowItWorksAcknowledged = vi.hoisted(() => vi.fn())

vi.mock('uniswap/src/features/earn/analytics', async () => ({
  ...(await vi.importActual('uniswap/src/features/earn/analytics')),
  logEarnHowItWorksAcknowledged: mockLogEarnHowItWorksAcknowledged,
}))

const analyticsProperties = {
  entry_point: 'global_modal',
  surface: 'web',
  vault_id: 'vault-id',
} as EarnAnalyticsBaseProperties
const vaultId = 'vault-id'

describe(useAcknowledgeEarnHowItWorks, () => {
  beforeEach(() => {
    mockLogEarnHowItWorksAcknowledged.mockClear()
  })

  it('records and persists an acknowledgement before continuing', () => {
    const onContinue = vi.fn()
    const { result, store } = renderHookWithProviders(() =>
      useAcknowledgeEarnHowItWorks({ analyticsProperties, onContinue, vaultId }),
    )

    act(() => result.current())

    expect(mockLogEarnHowItWorksAcknowledged).toHaveBeenCalledWith(analyticsProperties)
    expect(store.getState().uniswapBehaviorHistory.earnHowItWorksAcknowledgedByVaultId?.[vaultId]).toBe(true)
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('does nothing until analytics properties are available', () => {
    const onContinue = vi.fn()
    const { result, store } = renderHookWithProviders(() =>
      useAcknowledgeEarnHowItWorks({ analyticsProperties: undefined, onContinue, vaultId }),
    )

    act(() => result.current())

    expect(mockLogEarnHowItWorksAcknowledged).not.toHaveBeenCalled()
    expect(store.getState().uniswapBehaviorHistory).toEqual(initialUniswapBehaviorHistoryState)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('acknowledges a new vault after the hook inputs change', () => {
    const onContinue = vi.fn()
    const secondVaultId = 'second-vault-id'
    const { result, rerender, store } = renderHookWithProviders(
      (currentVaultId: string) =>
        useAcknowledgeEarnHowItWorks({ analyticsProperties, onContinue, vaultId: currentVaultId }),
      { initialProps: [vaultId] },
    )

    act(() => result.current())
    rerender([secondVaultId])
    act(() => result.current())

    expect(mockLogEarnHowItWorksAcknowledged).toHaveBeenCalledTimes(2)
    expect(store.getState().uniswapBehaviorHistory.earnHowItWorksAcknowledgedByVaultId).toEqual({
      [vaultId]: true,
      [secondVaultId]: true,
    })
    expect(onContinue).toHaveBeenCalledTimes(2)
  })
})
