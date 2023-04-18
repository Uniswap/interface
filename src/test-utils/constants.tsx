import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { V3Route } from '@uniswap/smart-order-router'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'

export const testToken1 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC')
export const testToken2 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF')
export const testToken3 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 'GHI')
export const testRecipientAddress = '0x0fF2D1eFd7A57B7562b2bf27F3f37899dB27F4a5'

export const testPool12 = new Pool(
  testToken1,
  testToken2,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const testPool13 = new Pool(
  testToken1,
  testToken3,
  FeeAmount.MEDIUM,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const testCurrencyAmount = (token: Token, amount: number) =>
  CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

export const testTradeExactInput = new InterfaceTrade({
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

export const testTradeExactOutput = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([testPool13], testToken1, testToken3),
      inputAmount: testCurrencyAmount(testToken1, 1000),
      outputAmount: testCurrencyAmount(testToken3, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_OUTPUT,
})

export const testAllowedSlippage = new Percent(2, 100)
