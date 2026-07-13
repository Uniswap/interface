import { CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LaunchAuctionErrorModal } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionErrorModal'
import { PriceSettingsSection } from '~/pages/Liquidity/CreateAuction/components/PriceSettingsSection'
import { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/components/CurrencyLogo/CurrencyLogo', () => ({
  CurrencyLogo: ({ currencyInfo }: { currencyInfo: { currency: { symbol?: string } } }) => (
    <span>{currencyInfo.currency.symbol}</span>
  ),
}))

vi.mock('uniswap/src/components/dialog/Dialog', () => ({
  Dialog: ({ getHelpUrl }: { getHelpUrl?: string }) => <a href={getHelpUrl}>Get help</a>,
}))

vi.mock('~/pages/Liquidity/CreateAuction/components/FloorPriceSelector', () => ({
  FloorPriceSelector: () => <div data-testid="floor-price-selector" />,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async () => {
  const { Ether, Token } = await vi.importActual<typeof import('@uniswap/sdk-core')>('@uniswap/sdk-core')
  const { UniverseChainId } = await vi.importActual<typeof import('uniswap/src/features/chains/types')>(
    'uniswap/src/features/chains/types',
  )
  const eth = Ether.onChain(UniverseChainId.Mainnet)
  const usdc = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')

  return {
    useNativeCurrencyInfo: () => ({ currency: eth }),
    useCurrencyInfo: () => ({ currency: usdc }),
  }
})

describe('create auction help links', () => {
  it('points the raise-currency help link to the configure-auction section', () => {
    render(
      <PriceSettingsSection
        chainId={UniverseChainId.Mainnet}
        raiseCurrency={RaiseCurrency.NATIVE}
        onSelect={() => undefined}
        floorPrice=""
        floorPriceInput={undefined}
        tokenTotalSupply={CurrencyAmount.fromRawAmount(Ether.onChain(UniverseChainId.Mainnet), '1000000000000000000')}
        inputCurrency="raise"
        usdPriceNum={null}
        onInputCurrencyChange={() => undefined}
        onFloorPriceChange={() => undefined}
      />,
    )

    expect(screen.getByRole('link', { name: 'How to choose your raise currency?' })).toHaveAttribute(
      'href',
      UniswapHelpUrls.articles.toucanLaunchAuctionConfigureAuctionHelp,
    )
  })

  it('points the launch failed modal help CTA to the launch auction article', () => {
    render(<LaunchAuctionErrorModal isOpen tokenSymbol="UNI" onClose={() => undefined} onRetry={() => undefined} />)

    expect(screen.getByRole('link', { name: 'Get help' })).toHaveAttribute(
      'href',
      UniswapHelpUrls.articles.toucanLaunchAuctionHelp,
    )
  })
})
