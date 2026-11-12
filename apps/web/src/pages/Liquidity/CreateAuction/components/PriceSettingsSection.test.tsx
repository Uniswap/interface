import { CurrencyAmount, Ether } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { PriceSettingsSection } from '~/pages/Liquidity/CreateAuction/components/PriceSettingsSection'
import { render, screen } from '~/test-utils/render'

const NATIVE_OPTION_DESCRIPTION = 'Offers native exposure to crypto markets.'
const STABLECOIN_OPTION_DESCRIPTION = 'Reduces volatility and price uncertainty.'
const RAISE_CURRENCY_HELP_LINK = 'How to choose your raise currency?'

vi.mock('uniswap/src/components/CurrencyLogo/CurrencyLogo', () => ({
  CurrencyLogo: ({ currencyInfo }: { currencyInfo: { currency: { symbol?: string } } }) => (
    <span>{currencyInfo.currency.symbol}</span>
  ),
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/FloorPriceSelector', () => ({
  FloorPriceSelector: () => <div data-testid="floor-price-selector" />,
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

function renderSection(chainId: UniverseChainId): void {
  render(
    <PriceSettingsSection
      chainId={chainId}
      raiseCurrency={RaiseCurrency.NATIVE}
      onSelect={() => undefined}
      floorPrice=""
      floorPriceInput={undefined}
      tokenTotalSupply={CurrencyAmount.fromRawAmount(Ether.onChain(chainId), '1000000000000000000')}
      inputCurrency="raise"
      usdPriceNum={null}
      onInputCurrencyChange={() => undefined}
      onFloorPriceChange={() => undefined}
    />,
  )
}

describe('PriceSettingsSection raise-currency picker', () => {
  it('offers both raise currencies when they are distinct tokens', () => {
    renderSection(UniverseChainId.Mainnet)

    expect(screen.getByText(NATIVE_OPTION_DESCRIPTION)).toBeInTheDocument()
    expect(screen.getByText(STABLECOIN_OPTION_DESCRIPTION)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: RAISE_CURRENCY_HELP_LINK })).toBeInTheDocument()
    expect(
      screen.getByText('Choose the token you want to receive bids in and set a floor price for your auction.'),
    ).toBeInTheDocument()
  })

  it('hides the picker when both raise currencies resolve to the same token', () => {
    renderSection(UniverseChainId.Arc)

    expect(screen.queryByText(NATIVE_OPTION_DESCRIPTION)).not.toBeInTheDocument()
    expect(screen.queryByText(STABLECOIN_OPTION_DESCRIPTION)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: RAISE_CURRENCY_HELP_LINK })).not.toBeInTheDocument()
    expect(screen.getByText('Set a floor price for your auction.')).toBeInTheDocument()
    expect(screen.getByTestId('floor-price-selector')).toBeInTheDocument()
    expect(screen.getByText('Price settings')).toBeInTheDocument()
  })

  it('still keeps the raise-currency help link reachable from the configure-auction article', () => {
    renderSection(UniverseChainId.Mainnet)

    expect(screen.getByRole('link', { name: RAISE_CURRENCY_HELP_LINK })).toHaveAttribute(
      'href',
      UniswapHelpUrls.articles.toucanLaunchAuctionConfigureAuctionHelp,
    )
  })
})
