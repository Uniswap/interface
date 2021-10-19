import { t } from '@lingui/macro'
import { Currency, currencyEquals, ETHER, WETH } from '@dynamic-amm/sdk'
import { useMemo } from 'react'
import { calculateGasMargin } from 'utils'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from './index'
import { useWETHContract } from './useContract'

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
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [inputCurrency, typedValue])
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (inputCurrency === ETHER && currencyEquals(WETH[chainId], outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.deposit({
                    value: `0x${inputAmount.raw.toString(16)}`
                  })
                  const txReceipt = await wethContract.deposit({
                    value: `0x${inputAmount.raw.toString(16)}`,
                    gasLimit: calculateGasMargin(estimateGas)
                  })
                  addTransaction(txReceipt, {
                    summary: `Wrap ${inputAmount.toSignificant(6)} ${
                      convertToNativeTokenFromETH(Currency.ETHER, chainId).symbol
                    } to W${convertToNativeTokenFromETH(Currency.ETHER, chainId).symbol}`
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
          : t`Insufficient ${convertToNativeTokenFromETH(Currency.ETHER, chainId).symbol} balance`
      }
    } else if (currencyEquals(WETH[chainId], inputCurrency) && outputCurrency === ETHER) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const estimateGas = await wethContract.estimateGas.withdraw(`0x${inputAmount.raw.toString(16)}`)
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.raw.toString(16)}`, {
                    gasLimit: calculateGasMargin(estimateGas)
                  })
                  addTransaction(txReceipt, { summary: `Unwrap ${inputAmount.toSignificant(6)} WETH to ETH` })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient W${convertToNativeTokenFromETH(Currency.ETHER, chainId).symbol} balance`
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction, typedValue])
}
