import { Token } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyIdWithThrow } from 'uniswap/src/utils/currencyId'
import { DepositTokenSelector } from './DepositTokenSelector'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/components/Dropdowns/AdaptiveDropdown', () => ({
  AdaptiveDropdown: ({ children, trigger }: { children: ReactNode; trigger: ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}))

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

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
        apyLabel="5.00%"
        options={[ethOption, wethOption]}
        selectedSourceCurrencyId={ethCurrencyId}
        onSelectSourceCurrency={onSelectSourceCurrency}
      />,
    )

    expect(screen.getAllByText('ETH').length).toBeGreaterThan(0)
    expect(screen.getByText('Wrapped Ether')).toBeInTheDocument()
    expect(screen.getByText('Ethereum ETH')).toBeInTheDocument()
    expect(screen.getByText('Ethereum WETH')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Wrapped Ether'))

    expect(onSelectSourceCurrency).toHaveBeenCalledWith(wethCurrencyId)
  })
})
