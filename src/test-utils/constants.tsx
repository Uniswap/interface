import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

export const testToken1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
export const testToken2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)
export const testToken3 = new Token(1, '0x0000000000000000000000000000000000000003', 18)
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
