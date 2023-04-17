import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'

export const noop = () => null
export const testToken1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
export const testToken2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)
export const testRecipientAddress = '0x1f8F72aA9304c8B593d555F12eF6589cC3A579A2'

const testPool12 = new Pool(
  testToken1,
  testToken2,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

const testCurrencyAmount = (token: Token, amount: number) => CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

export const testTrade = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([testPool12], testToken1, testToken2),
      inputAmount: testCurrencyAmount(testToken1, 1000),
      outputAmount: testCurrencyAmount(testToken2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
})

export const testAllowedSlippage = new Percent(2, 100)
