import 'test-utils/tokens/mocks'

import userEvent from '@testing-library/user-event'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { PoolDetailsStatsButtons } from 'components/Pools/PoolDetails/PoolDetailsStatsButtons'
import { useAccount } from 'hooks/useAccount'
import store from 'state'
import { USE_DISCONNECTED_ACCOUNT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { useMultiChainPositionsReturnValue, validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/slice/slice'

jest.mock('components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions')

jest.mock('hooks/useAccount')

jest.mock('uniswap/src/contexts/UniswapContext')

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    useFeatureFlagWithLoading: jest.fn().mockReturnValue({
      isLoading: false,
      value: true,
    }),
  }
})

describe('PoolDetailsStatsButton', () => {
  const mockProps = {
    chainId: UniverseChainId.Mainnet,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    feeTier: 500,
  } as const

  const mockPropsTokensReversed = {
    ...mockProps,
    token0: validBEPoolToken1,
    token1: validBEPoolToken0,
  }

  const useUniswapContextReturnValue = {
    navigateToFiatOnRamp: () => {},
    navigateToSwapFlow: () => {},
    onSwapChainsChanged: () => {},
    isSwapTokenSelectorOpen: false,
    setSwapOutputChainId: () => {},
    setIsSwapTokenSelectorOpen: () => {},
    signer: undefined,
    useProviderHook: () => undefined,
  }

  beforeEach(() => {
    mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
    mocked(useUniswapContext).mockReturnValue(useUniswapContextReturnValue)
    mocked(useFeatureFlagWithLoading).mockReturnValue({
      isLoading: false,
      value: false,
    })
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      }),
    )
    store.dispatch(
      dismissTokenWarning({
        token: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
      }),
    )
  })

  it('loading skeleton shown correctly', () => {
    const { asFragment } = render(<PoolDetailsStatsButtons {...mockProps} loading={true} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pdp-buttons-loading-skeleton')).toBeVisible()
  })

  it('renders both buttons correctly', async () => {
    jest.useFakeTimers()
    window.history.pushState({}, '', '/swap')
    const { asFragment } = await act(() => render(<PoolDetailsStatsButtons {...mockProps} />))

    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pool-details-add-liquidity-button')).toBeVisible()
    expect(screen.getByTestId('pool-details-swap-button')).toBeVisible()
    jest.useRealTimers()
  })

  it('clicking swap reveals swap modal', async () => {
    render(<PoolDetailsStatsButtons {...mockProps} />)

    await userEvent.click(screen.getByTestId('pool-details-swap-button'))
    expect(screen.getByTestId('pool-details-swap-modal')).toBeVisible()
    expect(screen.getByTestId('pool-details-close-button')).toBeVisible()
  })

  it('clicking add liquidity goes to correct url', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await userEvent.click(screen.getByTestId('pool-details-add-liquidity-button'))
    expect(globalThis.window.location.href).toContain(
      '/add/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/500',
    )
  })
})
