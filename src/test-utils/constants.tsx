import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'

const noop = () => null
const token1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const token2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)
const recipientAddress = '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2'

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
