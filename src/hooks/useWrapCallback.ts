import { Currency, currencyEquals } from '@swapr/sdk'
import { useMemo } from 'react'
import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from './index'
import { useNativeCurrencyWrapperContract, useWrappingToken } from './useContract'
import { useNativeCurrency } from './useNativeCurrency'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
  typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { chainId, account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyWrapperToken = useWrappingToken(nativeCurrency)
  const nativeCurrencyWrapperContract = useNativeCurrencyWrapperContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency, chainId), [
    inputCurrency,
    typedValue,
    chainId
  ])
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!nativeCurrencyWrapperContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (
      Currency.isNative(inputCurrency) &&
      nativeCurrencyWrapperToken &&
      currencyEquals(nativeCurrencyWrapperToken, outputCurrency)
    ) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await nativeCurrencyWrapperContract.deposit({
                    value: `0x${inputAmount.raw.toString(16)}`
                  })
                  addTransaction(txReceipt, {
                    summary: `Wrap ${inputAmount.toSignificant(6)} ${nativeCurrency.symbol} to ${
                      nativeCurrencyWrapperToken.symbol
                    }`
                  })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : 'Insufficient ETH balance'
      }
    } else if (
      nativeCurrencyWrapperToken &&
      currencyEquals(nativeCurrencyWrapperToken, inputCurrency) &&
      outputCurrency === nativeCurrency
    ) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await nativeCurrencyWrapperContract.withdraw(`0x${inputAmount.raw.toString(16)}`)
                  addTransaction(txReceipt, {
                    summary: `Unwrap ${inputAmount.toSignificant(6)} ${nativeCurrencyWrapperToken.symbol} to ${
                      nativeCurrency.symbol
                    }`
                  })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : 'Insufficient WETH balance'
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [
    nativeCurrencyWrapperContract,
    chainId,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    nativeCurrencyWrapperToken,
    nativeCurrency,
    addTransaction
  ])
}
