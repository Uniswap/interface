import { CToken } from '../../data/CToken'
import { useCTokenBalance } from '../wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { LendField } from './actions'
import { CurrencyAmount, JSBI, TokenAmount } from '@uniswap/sdk'
import { tryParseAmount } from '../swap/hooks'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
  const liquidityValue = new TokenAmount(lendToken, lendToken.getLiquidityValue())
  if (lendMarket === LendField.SUPPLY && !inputError) {
    if (walletBalance) {
      if (!parseInputValue) {
        inputError = true
        inputText = t(lendMarket.toLowerCase())
      } else if (JSBI.equal(walletBalance.raw, ZERO) || JSBI.greaterThan(parseInputValue.raw, walletBalance.raw)) {
        inputError = true
        inputText = t('noFundsAvailable')
      } else {
        inputText = t(lendMarket.toLowerCase())
      }
    } else {
      inputError = true
      inputText = t('noFundsAvailable')
    }
  }

  if (lendMarket === LendField.WITHDRAW && !inputError) {
    if (protocolSuppleyBalance) {
      if (JSBI.equal(protocolSuppleyBalance.raw, ZERO)) {
        inputError = true
        inputText = t('noBalanceToWithdraw')
      } else if (!parseInputValue) {
        inputError = true
        inputText = t(lendMarket.toLowerCase())
      } else if (parseInputValue && withdrawMax?.lessThan(parseInputValue)) {
        inputError = true
        inputText = t('insufficientLiquidity')
      } else {
        inputText = t(lendMarket.toLowerCase())
      }
    } else {
      inputError = true
      inputText = t('noBalanceToWithdraw')
    }
  }

  if (lendMarket === LendField.REPAY && !inputError) {
    if (!protocolBorrowBalance || JSBI.equal(protocolBorrowBalance.raw, ZERO)) {
      inputError = true
      inputText = t('noBalanceToRepay')
    } else if (parseInputValue && JSBI.greaterThan(parseInputValue?.raw, protocolBorrowBalance.raw)) {
      inputError = true
      inputText = 'Exceed borrow balance'
    } else if (JSBI.equal(parseInputValue?.raw ?? ZERO, ZERO) || !parseInputValue) {
      inputError = true
      inputText = t(lendMarket.toLowerCase())
    } else if (JSBI.greaterThan(parseInputValue.raw, walletBalance?.raw ?? ZERO)) {
      inputError = true
      inputText = t('noFundsAvailable')
    } else {
      inputText = t(lendMarket.toLowerCase())
    }
  }

  if (lendMarket === LendField.BORROW && !inputError) {
    if (JSBI.equal(limit, ZERO)) {
      inputError = true
      inputText = t('borrowingLimitReached')
    } else if (JSBI.equal(liquidityValue?.raw, ZERO)) {
      inputError = true
      inputText = t('insufficientLiquidity')
    } else if (JSBI.equal(parseInputValue?.raw ?? ZERO, ZERO) || !parseInputValue) {
      inputError = true
      inputText = lendMarket
    } else if (parseInputValue && borrowMax?.lessThan(parseInputValue)) {
      inputError = true
      inputText = t('insufficientCollateral')
    } else {
      inputText = lendMarket
    }
  }

  inputText = inputText ?? t(lendMarket?.toLowerCase())

  return { inputError, inputText }
}
