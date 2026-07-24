import { Token } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyIdWithThrow,
} from 'uniswap/src/utils/currencyId'
import { DepositTokenSelector } from './DepositTokenSelector'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/components/Dropdowns/AdaptiveDropdown', () => ({
  AdaptiveDropdown: ({
    children,
    matchTriggerWidth,
    trigger,
  }: {
    children: ReactNode
    matchTriggerWidth?: boolean
    trigger: ReactNode
  }) => (
    <div data-testid="adaptive-dropdown" data-match-trigger-width={String(!!matchTriggerWidth)}>
      {trigger}
      {children}
    </div>
  ),
}))

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

function createOption({
  balanceQuantity,
  balanceUsd,
  currencyInfo,
}: {
  balanceQuantity: number
  balanceUsd: number
  currencyInfo: CurrencyInfo
}): EarnDepositSourceOption {
  return {
    id: currencyInfo.currencyId,
    chainId: currencyInfo.currency.chainId,
    currencyInfo,
    balanceQuantity,
    balanceUsd,
  }
}

describe(DepositTokenSelector, () => {
  it('keeps same-chain ETH and WETH deposit sources as distinct selectable rows', () => {
    const ethCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const wethCurrencyId = buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet)
    const onSelectSourceCurrency = vi.fn()

    const ethOption = createOption({
      balanceQuantity: 1,
      balanceUsd: 3000,
      currencyInfo: {
        currency: nativeOnChain(UniverseChainId.Mainnet),
        currencyId: ethCurrencyId,
        logoUrl: undefined,
      },
    })
    const wethOption = createOption({
      balanceQuantity: 2,
      balanceUsd: 6000,
      currencyInfo: {
        currency: new Token(UniverseChainId.Mainnet, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether'),
        currencyId: wethCurrencyId,
        logoUrl: undefined,
      },
    })

    render(
      <DepositTokenSelector
        displayBalanceInFiat={false}
        options={[ethOption, wethOption]}
        unsupportedOptions={[]}
        selectedSourceCurrencyId={ethCurrencyId}
        onSelectSourceCurrency={onSelectSourceCurrency}
      />,
    )

    expect(screen.getAllByText('ETH').length).toBeGreaterThan(0)
    expect(screen.getByTestId('adaptive-dropdown')).toHaveAttribute('data-match-trigger-width', 'true')
    expect(screen.getByText('Wrapped Ether')).toBeInTheDocument()
    expect(screen.getByText('Ethereum ETH')).toBeInTheDocument()
    expect(screen.getByText('Ethereum WETH')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Wrapped Ether'))

    expect(onSelectSourceCurrency).toHaveBeenCalledWith(wethCurrencyId)
  })

  it('renders the selected balance in the active input unit without APY', () => {
    const ethCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const onSelectSourceCurrency = vi.fn()
    const ethOption = createOption({
      balanceQuantity: 1,
      balanceUsd: 3000,
      currencyInfo: {
        currency: nativeOnChain(UniverseChainId.Mainnet),
        currencyId: ethCurrencyId,
        logoUrl: undefined,
      },
    })

    const { rerender } = render(
      <DepositTokenSelector
        displayBalanceInFiat
        options={[ethOption]}
        unsupportedOptions={[]}
        selectedSourceCurrencyId={ethCurrencyId}
        onSelectSourceCurrency={onSelectSourceCurrency}
      />,
    )

    expect(screen.getByText('$3,000.00 available')).toBeInTheDocument()
    expect(screen.queryByText('5.00%')).not.toBeInTheDocument()

    rerender(
      <DepositTokenSelector
        displayBalanceInFiat={false}
        options={[ethOption]}
        unsupportedOptions={[]}
        selectedSourceCurrencyId={ethCurrencyId}
        onSelectSourceCurrency={onSelectSourceCurrency}
      />,
    )

    expect(screen.getByText('1.00 available')).toBeInTheDocument()
    expect(screen.queryByText('$3,000.00 available')).not.toBeInTheDocument()
  })

  it('renders unsupported network balances as collapsed disabled rows', () => {
    const ethCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const polygonUsdcCurrencyId = buildCurrencyId(UniverseChainId.Polygon, POLYGON_USDC_ADDRESS)
    const onSelectSourceCurrency = vi.fn()

    const ethOption = createOption({
      balanceQuantity: 1,
      balanceUsd: 3000,
      currencyInfo: {
        currency: nativeOnChain(UniverseChainId.Mainnet),
        currencyId: ethCurrencyId,
        logoUrl: undefined,
      },
    })
    const polygonUsdcOption = createOption({
      balanceQuantity: 25,
      balanceUsd: 25,
      currencyInfo: {
        currency: new Token(UniverseChainId.Polygon, POLYGON_USDC_ADDRESS, 6, 'USDC', 'USD Coin'),
        currencyId: polygonUsdcCurrencyId,
        logoUrl: undefined,
      },
    })

    render(
      <DepositTokenSelector
        displayBalanceInFiat={false}
        options={[ethOption]}
        unsupportedOptions={[polygonUsdcOption]}
        selectedSourceCurrencyId={ethCurrencyId}
        onSelectSourceCurrency={onSelectSourceCurrency}
      />,
    )

    expect(screen.getByText('Unsupported networks')).toBeInTheDocument()
    expect(screen.queryByText('Polygon USDC')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Unsupported networks'))

    expect(screen.getByText('Polygon USDC')).toBeInTheDocument()

    fireEvent.click(screen.getByText('USD Coin'))

    expect(onSelectSourceCurrency).not.toHaveBeenCalled()
  })

  it('does not promote an unsupported-only balance as the selected deposit source', () => {
    const polygonUsdcCurrencyId = buildCurrencyId(UniverseChainId.Polygon, POLYGON_USDC_ADDRESS)
    const polygonUsdcOption = createOption({
      balanceQuantity: 25,
      balanceUsd: 25,
      currencyInfo: {
        currency: new Token(UniverseChainId.Polygon, POLYGON_USDC_ADDRESS, 6, 'USDC', 'USD Coin'),
        currencyId: polygonUsdcCurrencyId,
        logoUrl: undefined,
      },
    })

    render(
      <DepositTokenSelector
        displayBalanceInFiat={false}
        options={[]}
        unsupportedOptions={[polygonUsdcOption]}
        selectedSourceCurrencyId={polygonUsdcCurrencyId}
        onSelectSourceCurrency={vi.fn()}
      />,
    )

    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
    expect(screen.queryByText('Polygon USDC')).not.toBeInTheDocument()
  })
})
