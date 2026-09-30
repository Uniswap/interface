import '~/test-utils/tokens/mocks'
import userEvent from '@testing-library/user-event'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import * as useSwapFormStoreModule from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { useMultiChainPositions } from '~/pages/PoolDetails/Pools/hooks/useMultiChainPositions'
import store from '~/state'
import { USE_DISCONNECTED_ACCOUNT } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import {
  useMultiChainPositionsReturnValue,
  validParsedPoolToken0,
  validParsedPoolToken1,
} from '~/test-utils/pools/fixtures'
import { act, render, screen } from '~/test-utils/render'

vi.mock('~/pages/PoolDetails/Pools/hooks/useMultiChainPositions')

vi.mock('~/hooks/useAccount')

vi.mock('uniswap/src/contexts/UniswapContext')

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext')

vi.mock('~/pages/Swap', () => {
  return {
    Swap: () => <div>Swap Component</div>,
  }
})

// These cases are about URL construction, so the geo gate is pinned to "confirmed clean" to keep them
// independent of compliance query timing. The gate's own behaviour is covered in
// PoolDetailsAddLiquidityGeoSeam.test.tsx.
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))

describe('PoolDetailsStatsButton', () => {
  const mockProps = {
    chainId: UniverseChainId.Mainnet,
    poolIdOrAddress: '0xpool',
    token0: validParsedPoolToken0,
    token1: validParsedPoolToken1,
    feeTier: 500,
    protocolVersion: ProtocolVersion.V3,
  } as const

  const mockPropsTokensReversed = {
    ...mockProps,
    token0: validParsedPoolToken1,
    token1: validParsedPoolToken0,
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
    navigateToNftDetails: () => {},
    navigateToAdvancedSettings: () => {},
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

    mocked(useLPGeoRestriction).mockReturnValue({
      isGeoRestricted: false,
      restrictedTokenSymbol: undefined,
      unavailableLabel: 'Not available in your region',
    })
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
        warning: TokenProtectionWarning.NonDefault,
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
        warning: TokenProtectionWarning.NonDefault,
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

  it('clicking add liquidity goes to correct url with default fee tier', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} />)

    await userEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))
    expect(globalThis.window.location.href).toContain(
      '/positions/add/ethereum/0xpool?currencyA=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&currencyB=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum&fee=%7B%22feeAmount%22%3A500%2C%22tickSpacing%22%3A0%2C%22isDynamic%22%3Afalse%7D&protocolVersion=v3&step=1',
    )
  })

  it('clicking add liquidity goes to correct url with custom fee tier', async () => {
    render(<PoolDetailsStatsButtons {...mockPropsTokensReversed} feeTier={6200} tickSpacing={11} isDynamic={true} />)
    await userEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))
    expect(globalThis.window.location.href).toContain(
      '/positions/add/ethereum/0xpool?currencyA=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&currencyB=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&chain=ethereum&fee=%7B%22feeAmount%22%3A6200%2C%22tickSpacing%22%3A11%2C%22isDynamic%22%3Atrue%7D&protocolVersion=v3&step=1',
    )
  })
})
