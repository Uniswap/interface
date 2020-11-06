import { CToken } from '../../data/CToken'
import { useCTokenBalance } from '../wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { LendField } from './actions'
import { CurrencyAmount, JSBI, TokenAmount } from '@uniswap/sdk'
import { tryParseAmount } from '../swap/hooks'

// based on typed value
export function useLendingInfo(
  lendInputValue: string,
  lendToken: CToken | undefined,
  lendMarket: LendField | undefined,
  limit: JSBI,
  withdrawMax: CurrencyAmount | undefined,
  borrowMax: CurrencyAmount | undefined
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

  const ZERO = JSBI.BigInt(0)
  // Protocol Balance
  const parseInputValue: CurrencyAmount | undefined = tryParseAmount(lendInputValue, lendToken)
  const protocolBorrowBalance = new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount())
  const protocolSuppleyBalance = new TokenAmount(lendToken, lendToken.getSupplyBalanceAmount())
  if (lendMarket === LendField.SUPPLY && !inputError) {
    if (walletBalance) {
      if (!parseInputValue) {
        inputError = true
        inputText = lendMarket
      } else if (JSBI.equal(walletBalance.raw, ZERO) || JSBI.greaterThan(parseInputValue.raw, walletBalance.raw)) {
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
      if (JSBI.equal(protocolSuppleyBalance.raw, ZERO)) {
        inputError = true
        inputText = 'No Balance to Withdraw'
      } else if (!parseInputValue) {
        inputError = true
        inputText = lendMarket
      } else if (parseInputValue && withdrawMax?.lessThan(parseInputValue)) {
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
    if (!protocolBorrowBalance || JSBI.equal(protocolBorrowBalance.raw, ZERO)) {
      inputError = true
      inputText = 'No Balance to Repay'
    } else if (parseInputValue && JSBI.greaterThan(parseInputValue?.raw, protocolBorrowBalance.raw)) {
      inputError = true
      inputText = 'Exceed borrow balance'
    } else if (parseInputValue?.raw === ZERO || !parseInputValue) {
      inputError = true
      inputText = lendMarket
    } else if (JSBI.greaterThan(parseInputValue.raw, walletBalance?.raw ?? ZERO)) {
      inputError = true
      inputText = 'No funds available'
    } else {
      inputText = lendMarket
    }
  }

  if (lendMarket === LendField.BORROW && !inputError) {
    if (limit === ZERO) {
      inputError = true
      inputText = 'Borrowing limit reached'
    } else if (parseInputValue?.raw === ZERO || !parseInputValue) {
      inputError = true
      inputText = lendMarket
    } else if (parseInputValue && borrowMax?.lessThan(parseInputValue)) {
      inputError = true
      inputText = 'Insufficient Collateral'
    } else {
      inputText = lendMarket
    }
  }

  inputText = inputText ?? lendMarket

  return { inputError, inputText }
}
