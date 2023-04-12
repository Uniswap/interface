import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'
import { render, screen } from 'test-utils'

import SwapModalFooter from './SwapModalFooter'

const swapErrorMessage = 'swap error'
const fiatValue = { data: 123, isLoading: false }

const token1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const token2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)

const pool12 = new Pool(token1, token2, FeeAmount.HIGH, '2437312313659959819381354528', '10272714736694327408', -69633)

const currencyAmount = (token: Token, amount: number) => CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

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

describe('SwapModalFooter.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapModalFooter
        trade={trade}
        allowedSlippage={allowedSlippage}
        hash={undefined}
        onConfirm={() => null}
        disabledConfirm={true}
        swapErrorMessage={swapErrorMessage}
        swapQuoteReceivedDate={undefined}
        fiatValueInput={fiatValue}
        fiatValueOutput={fiatValue}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByTestId('confirm-swap-button')).toBeDisabled()
  })
})
