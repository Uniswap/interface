import userEvent from '@testing-library/user-event'
import { ChainId } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { TokenFromList } from 'state/lists/tokenFromList'
import { act, render, screen } from 'test-utils/render'

import { CurrentPageBreadcrumb } from '.'

describe('BreadcrumbNav', () => {
  it('renders hover components correctly', async () => {
    const currency = new TokenFromList({
      chainId: 1,
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      name: 'Wrapped BTC',
      decimals: 18,
      symbol: 'WBTC',
    })
    const { asFragment } = render(
      <CurrentPageBreadcrumb address="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" currency={currency} />
    )
    expect(asFragment()).toMatchSnapshot()

    await act(() => userEvent.hover(screen.getByTestId('current-breadcrumb')))
    expect(screen.getByTestId('breadcrumb-hover-copy')).toBeInTheDocument()
    await act(() => userEvent.unhover(screen.getByTestId('current-breadcrumb')))
    expect(screen.queryByTestId('breadcrumb-hover-copy')).not.toBeInTheDocument()
  })

  it('does not display address hover for native tokens', async () => {
    const ETH = nativeOnChain(ChainId.MAINNET)
    const { asFragment } = render(<CurrentPageBreadcrumb address={NATIVE_CHAIN_ID} currency={ETH} />)
    expect(asFragment()).toMatchSnapshot()

    await act(() => userEvent.hover(screen.getByTestId('current-breadcrumb')))
    expect(screen.queryByTestId('breadcrumb-hover-copy')).not.toBeInTheDocument()
  })
})
