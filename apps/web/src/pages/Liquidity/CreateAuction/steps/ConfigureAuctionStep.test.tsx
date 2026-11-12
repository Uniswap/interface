import { UniverseChainId } from '@universe/chains'
import { describe, expect, it, vi } from 'vitest'
import { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { ConfigureAuctionStep } from '~/pages/Liquidity/CreateAuction/steps/ConfigureAuctionStep'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { render, screen } from '~/test-utils/render'

// Copy of the picker's option copy, so the assertions below are about what the user sees.
const NATIVE_OPTION_DESCRIPTION = 'Offers native exposure to crypto markets.'
const STABLECOIN_OPTION_DESCRIPTION = 'Reduces volatility and price uncertainty.'
const SINGLE_RAISE_CURRENCY_DESCRIPTION = 'Set a floor price for your auction.'

// The chain each raise-currency consumer is handed: the bug this guards is one step holding two.
const captured = vi.hoisted(() => ({
  launchThresholdChainId: undefined as number | undefined,
  usdPriceChainId: undefined as number | undefined,
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/FloorPriceSelector', () => ({
  FloorPriceSelector: () => <div data-testid="floor-price-selector" />,
}))

vi.mock('uniswap/src/components/CurrencyLogo/CurrencyLogo', () => ({
  CurrencyLogo: ({ currencyInfo }: { currencyInfo: { currency: { symbol?: string } } }) => (
    <span>{currencyInfo.currency.symbol}</span>
  ),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async () => {
  const { Ether, Token } = await vi.importActual<typeof import('@uniswap/sdk-core')>('@uniswap/sdk-core')
  const { UniverseChainId } = await vi.importActual<typeof import('@universe/chains')>('@universe/chains')

  return {
    useNativeCurrencyInfo: (chainId: UniverseChainId) => ({ currency: Ether.onChain(chainId) }),
    useCurrencyInfo: () => ({
      currency: new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC'),
    }),
  }
})

vi.mock('~/pages/Liquidity/CreateAuction/components/LaunchThresholdSection', () => ({
  LaunchThresholdSection: ({ chainId }: { chainId: number }) => {
    captured.launchThresholdChainId = chainId
    return null
  },
}))

vi.mock('~/pages/Liquidity/CreateAuction/hooks/useStableRaiseUsdPrice', () => ({
  useStableRaiseUsdPrice: ({ chainId }: { chainId: number }) => {
    captured.usdPriceChainId = chainId
    return null
  },
}))

/** Commits on `committedChainId`, then switches the network the way the step indicator allows. */
function renderStepAfterNetworkChange(committedChainId: UniverseChainId, launchChainId: UniverseChainId): void {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.updateCreateNewTokenField('network', committedChainId)
  actions.setRaiseCurrency(RaiseCurrency.STABLECOIN)
  actions.commitTokenFormAndAdvance()
  // The network changes without the commit running again, so the committed snapshot keeps the old
  // chain while the launch chain moves.
  actions.updateCreateNewTokenField('network', launchChainId)

  expect(store.getState().configureAuction.committed?.totalSupply.currency.chainId).toBe(committedChainId)

  render(
    <CreateAuctionStoreContext.Provider value={store}>
      <ConfigureAuctionStep />
    </CreateAuctionStoreContext.Provider>,
  )
}

describe('ConfigureAuctionStep launch chain', () => {
  it('hides the picker and prices on the launch chain after a post-commit network change', () => {
    renderStepAfterNetworkChange(UniverseChainId.Mainnet, UniverseChainId.Arc)

    // Reading the committed chain here would render the picker with the native card checked and
    // the stablecoin card dead (selecting it is a no-op in the store), and price the floor in the
    // old chain's native asset.
    expect(screen.queryByText(NATIVE_OPTION_DESCRIPTION)).not.toBeInTheDocument()
    expect(screen.queryByText(STABLECOIN_OPTION_DESCRIPTION)).not.toBeInTheDocument()
    expect(screen.getByText(SINGLE_RAISE_CURRENCY_DESCRIPTION)).toBeInTheDocument()
    expect(captured.usdPriceChainId).toBe(UniverseChainId.Arc)
    expect(captured.launchThresholdChainId).toBe(UniverseChainId.Arc)
  })

  it('keeps the picker on a launch chain whose raise options differ', () => {
    renderStepAfterNetworkChange(UniverseChainId.Arc, UniverseChainId.Mainnet)

    expect(screen.getByText(NATIVE_OPTION_DESCRIPTION)).toBeInTheDocument()
    expect(screen.getByText(STABLECOIN_OPTION_DESCRIPTION)).toBeInTheDocument()
    expect(captured.usdPriceChainId).toBe(UniverseChainId.Mainnet)
    expect(captured.launchThresholdChainId).toBe(UniverseChainId.Mainnet)
  })
})
