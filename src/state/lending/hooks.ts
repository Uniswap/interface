import { CToken } from '../../data/CToken'
import { useCTokenBalance } from '../wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { LendField } from './actions'
import { CurrencyAmount, Fraction, JSBI, TokenAmount } from '@uniswap/sdk'
import { tryParseAmount } from '../swap/hooks'
import { EXA_BASE, transferCurrencyAmount } from '../../utils'

// based on typed value
export function useLendingInfo(
  lendInputValue: string,
  lendToken: CToken | undefined,
  lendMarket: LendField | undefined,
  limit: JSBI,
  withdrawMax?: Fraction,
  borrowMax?: Fraction
): {
  inputError?: boolean
  inputText?: string
} {
  const { account } = useActiveWeb3React()
  // Wallet Balance
  const walletBalance = useCTokenBalance(lendToken)
  let inputError = false
  let inputText: string | undefined

  if (!account) {
    inputError = true
    inputText = 'Connect Wallet'
  }
  if (!lendToken || inputError) {
    inputError = true
    inputText = inputText ?? 'Data Error'
    return { inputError, inputText }
  }
  // Protocol Balance
  const parseInputValue: CurrencyAmount | undefined = tryParseAmount(lendInputValue, lendToken)
  const protocolBorrowBalance = new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount())
  const protocolSuppleyBalance = new TokenAmount(lendToken, lendToken.getSupplyBalanceAmount())
  if (lendMarket === LendField.SUPPLY && !inputError) {
    if (walletBalance) {
      if (Number(lendInputValue) === 0 || !parseInputValue) {
        inputError = true
        inputText = lendMarket
      } else if (
        JSBI.equal(walletBalance?.raw ?? JSBI.BigInt(0), JSBI.BigInt(0)) ||
        JSBI.greaterThan(parseInputValue.raw, walletBalance.raw)
      ) {
        inputError = true
        inputText = 'No funds available'
      } else {
        inputText = lendMarket
      }
    } else {
      inputError = true
      inputText = 'No funds available'
    }
  }

  if (lendMarket === LendField.WITHDRAW && !inputError) {
    if (protocolSuppleyBalance) {
      if (JSBI.equal(protocolSuppleyBalance.raw, JSBI.BigInt(0))) {
        inputError = true
        inputText = 'No Balance to Withdraw'
      } else if (!parseInputValue) {
        inputError = true
        inputText = lendMarket
      } else if (
        parseInputValue &&
        withdrawMax?.lessThan(new Fraction(transferCurrencyAmount(parseInputValue), EXA_BASE))
      ) {
        inputError = true
        inputText = 'Insufficient Liquidity'
      } else {
        inputText = lendMarket
      }
    } else {
      inputError = true
      inputText = 'No Balance to Withdraw'
    }
  }

  if (lendMarket === LendField.REPAY && !inputError) {
    if (!protocolBorrowBalance) {
      inputError = true
      inputText = 'No Balance to Repay'
    } else if (JSBI.equal(protocolBorrowBalance.raw, JSBI.BigInt(0))) {
      inputError = true
      inputText = 'No Balance to Repay'
    } else if (parseInputValue && JSBI.greaterThan(parseInputValue?.raw, protocolBorrowBalance.raw)) {
      inputError = true
    } else if (Number(lendInputValue) === 0 || !parseInputValue) {
      inputError = true
      inputText = lendMarket
    } else if (JSBI.greaterThan(parseInputValue.raw, walletBalance?.raw ?? JSBI.BigInt(0))) {
      inputError = true
      inputText = 'No funds available'
    } else {
      inputText = lendMarket
    }
  }

  if (lendMarket === LendField.BORROW && !inputError) {
    if (Number(limit) === 0) {
      inputError = true
      inputText = 'Borrowing limit reached'
    } else if (Number(lendInputValue) === 0 || !parseInputValue) {
      inputError = true
      inputText = lendMarket
    } else if (
      parseInputValue &&
      !borrowMax?.greaterThan(new Fraction(transferCurrencyAmount(parseInputValue), EXA_BASE))
    ) {
      inputError = true
      inputText = 'Insufficient Collateral'
    }
  }

  inputText = inputText ?? lendMarket

  return { inputError, inputText }
}
