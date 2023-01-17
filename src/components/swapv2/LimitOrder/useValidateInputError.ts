import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { tryParseAmount } from 'state/swap/hooks'
import { formatNumberWithPrecisionRange } from 'utils'

const useValidateInputError = ({
  inputAmount,
  outputAmount,
  balance,
  displayRate,
  parsedActiveOrderMakingAmount,
  currencyIn,
  wrapInputError,
  showWrap,
  currencyOut,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  showWrap: boolean
  wrapInputError: any
  displayRate: string
  inputAmount: string
  outputAmount: string
  parsedActiveOrderMakingAmount: CurrencyAmount<Currency> | undefined
  balance: CurrencyAmount<Currency> | undefined
}) => {
  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const inputError = useMemo(() => {
    try {
      if (!inputAmount) return
      if (parseFloat(inputAmount) === 0 && (parseFloat(outputAmount) === 0 || parseFloat(displayRate) === 0)) {
        return t`Invalid input amount`
      }
      if (balance && parseInputAmount?.greaterThan(balance)) {
        return t`Insufficient ${currencyIn?.symbol} balance`
      }

      const remainBalance = parsedActiveOrderMakingAmount ? balance?.subtract(parsedActiveOrderMakingAmount) : undefined
      if (parseInputAmount && remainBalance?.lessThan(parseInputAmount)) {
        const formatNum = formatNumberWithPrecisionRange(parseFloat(remainBalance.toFixed(3)), 0, 10)
        return t`You don't have sufficient ${currencyIn?.symbol} balance. After your active orders, you have ${
          Number(formatNum) !== 0 ? '~' : ''
        }${formatNum} ${currencyIn?.symbol} left.`
      }

      if (!parseInputAmount) {
        return t`Your input amount is invalid.`
      }

      if (showWrap && wrapInputError) return wrapInputError
      return
    } catch (error) {
      return
    }
  }, [
    currencyIn,
    balance,
    inputAmount,
    outputAmount,
    displayRate,
    parsedActiveOrderMakingAmount,
    parseInputAmount,
    showWrap,
    wrapInputError,
  ])

  const outPutError = useMemo(() => {
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])
  return { inputError, outPutError }
}
export default useValidateInputError
