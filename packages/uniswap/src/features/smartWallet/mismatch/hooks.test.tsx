import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import React from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useRefetchMismatchOnStatsigReadyEffect } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import type { HasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { MismatchContext } from 'uniswap/src/features/smartWallet/mismatch/MismatchContextValue'
import {
  getIsMismatchAccountQueryOptions,
  type MisMatchQueryOptions,
} from 'uniswap/src/features/smartWallet/mismatch/queryOptions'

const mockUseStatsigClientStatus = vi.fn()

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useStatsigClientStatus: (): { isStatsigReady: boolean } => mockUseStatsigClientStatus(),
}))

const MOCK_ADDRESS = '0xMockAddress'
const CHAIN_KEY = String(UniverseChainId.Mainnet)

function createWrapper(input: {
  queryClient: QueryClient
  mismatchCallback: HasMismatchUtil
  onHasAnyMismatch: () => void
}): React.FC<PropsWithChildren> {
  return function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <QueryClientProvider client={input.queryClient}>
        <MismatchContext.Provider
          value={{
            mismatchCallback: input.mismatchCallback,
            account: { address: MOCK_ADDRESS, chainId: UniverseChainId.Mainnet },
            onHasAnyMismatch: input.onHasAnyMismatch,
            chains: [UniverseChainId.Mainnet],
            defaultChainId: UniverseChainId.Mainnet,
            isTestnetModeEnabled: false,
          }}
        >
          {children}
        </MismatchContext.Provider>
      </QueryClientProvider>
    )
  }
}

const getQueryOptions = (hasMismatch: HasMismatchUtil): MisMatchQueryOptions =>
  getIsMismatchAccountQueryOptions({ hasMismatch, isMainnet: true })({
    address: MOCK_ADDRESS,
    chainIds: [UniverseChainId.Mainnet],
  })

describe('useRefetchMismatchOnStatsigReadyEffect', () => {
  it('refetches the unobserved mismatch query and re-notifies when statsig becomes ready', async () => {
    const queryClient = new QueryClient()
    const onHasAnyMismatch = vi.fn()
    // pre-Statsig check found no mismatch; post-Statsig check finds one
    const mismatchCallback = vi
      .fn()
      .mockResolvedValueOnce({ [CHAIN_KEY]: false })
      .mockResolvedValue({ [CHAIN_KEY]: true })
    const queryOptions = getQueryOptions(mismatchCallback)

    // seed the cache the way the on-connect mutation does (no mounted observer afterwards)
    await queryClient.fetchQuery(queryOptions)
    expect(queryClient.getQueryData(queryOptions.queryKey)).toEqual({ [CHAIN_KEY]: false })

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: false })
    const { rerender } = renderHook(useRefetchMismatchOnStatsigReadyEffect, {
      wrapper: createWrapper({ queryClient, mismatchCallback, onHasAnyMismatch }),
    })

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: true })
    rerender()

    await waitFor(() => {
      expect(queryClient.getQueryData(queryOptions.queryKey)).toEqual({ [CHAIN_KEY]: true })
    })
    expect(onHasAnyMismatch).toHaveBeenCalledTimes(1)
  })

  it('does not re-notify when the refetch still finds no mismatch', async () => {
    const queryClient = new QueryClient()
    const onHasAnyMismatch = vi.fn()
    const mismatchCallback = vi.fn().mockResolvedValue({ [CHAIN_KEY]: false })
    const queryOptions = getQueryOptions(mismatchCallback)

    await queryClient.fetchQuery(queryOptions)

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: false })
    const { rerender } = renderHook(useRefetchMismatchOnStatsigReadyEffect, {
      wrapper: createWrapper({ queryClient, mismatchCallback, onHasAnyMismatch }),
    })

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: true })
    rerender()

    await waitFor(() => {
      expect(mismatchCallback).toHaveBeenCalledTimes(2)
    })
    expect(queryClient.getQueryData(queryOptions.queryKey)).toEqual({ [CHAIN_KEY]: false })
    expect(onHasAnyMismatch).not.toHaveBeenCalled()
  })

  it('does not refetch when statsig was already ready at mount', async () => {
    const queryClient = new QueryClient()
    const onHasAnyMismatch = vi.fn()
    const mismatchCallback = vi.fn().mockResolvedValue({ [CHAIN_KEY]: false })
    const queryOptions = getQueryOptions(mismatchCallback)

    await queryClient.fetchQuery(queryOptions)

    mockUseStatsigClientStatus.mockReturnValue({ isStatsigReady: true })
    const { rerender } = renderHook(useRefetchMismatchOnStatsigReadyEffect, {
      wrapper: createWrapper({ queryClient, mismatchCallback, onHasAnyMismatch }),
    })
    rerender()

    expect(mismatchCallback).toHaveBeenCalledTimes(1)
    expect(onHasAnyMismatch).not.toHaveBeenCalled()
  })
})
