import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'
import { fireEvent, render, screen } from 'test-utils/render'

import SwapDetailsDropdown from './SwapDetailsDropdown'

const token1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const token2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)

const pool12 = new Pool(token1, token2, FeeAmount.HIGH, '2437312313659959819381354528', '10272714736694327408', -69633)

const currencyAmount = (token: Token, amount: number) => CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))
jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

const trade = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([pool12], token1, token2),
      inputAmount: currencyAmount(token1, 1000),
      outputAmount: currencyAmount(token2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
})
const allowedSlippage = new Percent(2, 100)

describe('SwapDetailsDropdown.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapDetailsDropdown trade={trade} syncing={false} loading={false} allowedSlippage={allowedSlippage} />
    )
    expect(asFragment()).toMatchSnapshot()
    fireEvent.mouseOver(screen.getByTestId('info-icon'))
    expect(screen.getByTestId('advanced-swap-details-tooltip-content')).toBeInTheDocument()
  })

  it('loading state contains expected elements', () => {
    render(<SwapDetailsDropdown trade={undefined} syncing={true} loading={true} allowedSlippage={allowedSlippage} />)
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByText('Fetching best price...')).toBeInTheDocument()
  })

  it('interactive components work as expected once trade is loaded', () => {
    trade.gasUseEstimateUSD = currencyAmount(token1, 1)
    render(<SwapDetailsDropdown trade={trade} syncing={false} loading={false} allowedSlippage={allowedSlippage} />)

    expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    expect(screen.getByTestId('swap-details-header-row')).toBeInTheDocument()
    expect(screen.getByTestId('trade-price-container')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('swap-details-header-row'))
    expect(screen.getByTestId('advanced-swap-details')).toBeInTheDocument()
    expect(screen.getByTestId('swap-route-info')).toBeInTheDocument()
  })
})
