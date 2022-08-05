import { Currency, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { nativeOnChain } from 'constants/tokens'
import { calculateGasMargin } from 'utils'

import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from './index'
import { useWETHContract } from './useContract'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined,
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { chainId, account } = useActiveWeb3React()
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransactionWithType = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const nativeTokenSymbol = nativeOnChain(chainId).symbol

    if (inputCurrency.isNative && WETH[chainId].equals(outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.deposit({
                    value: `0x${inputAmount.quotient.toString(16)}`,
                  })
                  const txReceipt = await wethContract.deposit({
                    value: `0x${inputAmount.quotient.toString(16)}`,
                    gasLimit: calculateGasMargin(estimateGas),
                  })
                  addTransactionWithType(txReceipt, {
                    type: 'Wrap',
                    summary: `${inputAmount.toSignificant(6)} ${nativeTokenSymbol} to ${inputAmount.toSignificant(
                      6,
                    )} W${nativeTokenSymbol}`,
                  })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${nativeOnChain(chainId).symbol} balance`,
      }
    } else if (WETH[chainId].equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`, {
                    gasLimit: calculateGasMargin(estimateGas),
                  })
                  addTransactionWithType(txReceipt, {
                    type: 'Unwrap',
                    summary: `${inputAmount.toSignificant(6)} W${nativeTokenSymbol} to ${inputAmount.toSignificant(
                      6,
                    )} ${nativeTokenSymbol}`,
                  })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient W${nativeOnChain(chainId).symbol} balance`,
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransactionWithType, typedValue])
}
