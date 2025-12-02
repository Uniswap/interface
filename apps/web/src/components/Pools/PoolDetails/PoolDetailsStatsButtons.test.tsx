import 'test-utils/tokens/mocks'

import userEvent from '@testing-library/user-event'
import { GraphQLApi } from '@universe/api'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { PoolDetailsStatsButtons } from 'components/Pools/PoolDetails/PoolDetailsStatsButtons'
import { useAccount } from 'hooks/useAccount'
import store from 'state'
import { USE_DISCONNECTED_ACCOUNT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { useMultiChainPositionsReturnValue, validBEPoolToken0, validBEPoolToken1 } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/slice/slice'
import * as useSwapFormStoreModule from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

vi.mock('components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions')

vi.mock('hooks/useAccount')

vi.mock('uniswap/src/contexts/UniswapContext')

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext')

vi.mock('pages/Swap', () => {
  return {
    Swap: () => <div>Swap Component</div>,
  }
})

describe('PoolDetailsStatsButton', () => {
  const mockProps = {
    chainId: UniverseChainId.Mainnet,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    feeTier: 500,
    protocolVersion: GraphQLApi.ProtocolVersion.V3,
  } as const

  const mockPropsTokensReversed = {
    ...mockProps,
    token0: validBEPoolToken1,
    token1: validBEPoolToken0,
  }

  const useUniswapContextReturnValue = {
    navigateToFiatOnRamp: () => {},
    navigateToSwapFlow: () => {},
    navigateToSendFlow: () => {},
    navigateToReceive: () => {},
    handleShareToken: () => {},
    navigateToTokenDetails: () => {},
    navigateToPoolDetails: () => {},
    navigateToExternalProfile: () => {},
    navigateToNftCollection: () => {},
    navigateToNftDetails: () => {},
    onSwapChainsChanged: () => {},
    isSwapTokenSelectorOpen: false,
    setSwapOutputChainId: () => {},
    setIsSwapTokenSelectorOpen: () => {},
    signer: undefined,
    useProviderHook: () => undefined,
    useWalletDisplayName: () => undefined,
    useAccountsStoreContextHook: () => ({}) as AccountsStore,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    vi.spyOn(useSwapFormStoreModule, 'useSwapFormStore').mockImplementation((selector: any) =>
      selector({
        isFiatMode: false,
        updateSwapForm: () => {},
        exactAmountToken: '1',
        exactAmountFiat: '10',
        derivedSwapInfo: {
          currencies: {
            INPUT: {
              currencyId: '0x',
              currency: {} as GraphQLApi.Currency,
            },
          },
          chainId: UniverseChainId.Mainnet,
          trade: {
            gasFee: {
              value: '10',
              loading: false,
            },
          },
        },
        exactCurrencyField: 'INPUT',
      }),
    )

    mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
    mocked(useUniswapContext).mockReturnValue(useUniswapContextReturnValue)

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
    vi.useFakeTimers()
    window.history.pushState({}, '', '/swap')
    const { asFragment } = await act(() => render(<PoolDetailsStatsButtons {...mockProps} />))

    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton)).toBeVisible()
    expect(screen.getByTestId(TestID.PoolDetailsSwapButton)).toBeVisible()
    vi.useRealTimers()
  })

  it('clicking swap reveals swap modal', async () => {
    render(<PoolDetailsStatsButtons {...mockProps} />)

    await userEvent.click(screen.getByTestId(TestID.PoolDetailsSwapButton))
    expect(screen.getByTestId('pool-details-swap-modal')).toBeVisible()
    expect(screen.getByTestId('pool-details-close-button')).toBeVisible()
  })

  it('clicking add liquidity goes to correct url', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await userEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))
    expect(globalThis.window.location.href).toContain(
      '/positions/create/v3?currencyA=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&currencyB=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum',
    )
  })
})
