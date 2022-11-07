import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { formatToDecimal, getTokenAddress } from 'lib/utils/analytics'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo, useState } from 'react'

import { WRAPPED_NATIVE_CURRENCY } from '../constants/tokens'
import { useCurrencyBalance } from '../state/connection/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { TransactionType } from '../state/transactions/types'
import { useWETHContract } from './useContract'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }

enum WrapInputError {
  NO_ERROR, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT,
  ENTER_WRAPPED_AMOUNT,
  INSUFFICIENT_NATIVE_BALANCE,
  INSUFFICIENT_WRAPPED_BALANCE,
}

export function WrapErrorText({ wrapInputError }: { wrapInputError: WrapInputError }) {
  const native = useNativeCurrency()
  const wrapped = native?.wrapped

  switch (wrapInputError) {
    case WrapInputError.NO_ERROR:
      return null
    case WrapInputError.ENTER_NATIVE_AMOUNT:
      return <Trans>Enter {native?.symbol} amount</Trans>
    case WrapInputError.ENTER_WRAPPED_AMOUNT:
      return <Trans>Enter {wrapped?.symbol} amount</Trans>

    case WrapInputError.INSUFFICIENT_NATIVE_BALANCE:
      return <Trans>Insufficient {native?.symbol} balance</Trans>
    case WrapInputError.INSUFFICIENT_WRAPPED_BALANCE:
      return <Trans>Insufficient {wrapped?.symbol} balance</Trans>
  }
}

/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: WrapInputError } {
  const { chainId, account } = useWeb3React()
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue]
  )
  const addTransaction = useTransactionAdder()

  // This allows an async error to propagate within the React lifecycle.
  // Without rethrowing it here, it would not show up in the UI - only the dev console.
  const [error, setError] = useState<Error>()
  if (error) throw error

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    if (!weth) return NOT_APPLICABLE

    const hasInputAmount = Boolean(inputAmount?.greaterThan('0'))
    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const eventProperties = {
      token_in_address: getTokenAddress(inputCurrency),
      token_out_address: getTokenAddress(outputCurrency),
      token_in_symbol: inputCurrency.symbol,
      token_out_symbol: outputCurrency.symbol,
      chain_id: inputCurrency.chainId,
      amount: inputAmount ? formatToDecimal(inputAmount, inputAmount?.currency.decimals) : undefined,
    }

    if (inputCurrency.isNative && weth.equals(outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const network = await wethContract.provider.getNetwork()
                  if (
                    network.chainId !== chainId ||
                    wethContract.address !== WRAPPED_NATIVE_CURRENCY[network.chainId]?.address
                  ) {
                    sendAnalyticsEvent(EventName.WRAP_TOKEN_TXN_INVALIDATED, {
                      ...eventProperties,
                      contract_address: wethContract.address,
                      contract_chain_id: network.chainId,
                      type: WrapType.WRAP,
                    })
                    const error = new Error(`Invalid WETH contract
Please file a bug detailing how this happened - https://github.com/Uniswap/interface/issues/new?labels=bug&template=bug-report.md&title=Invalid%20WETH%20contract`)
                    setError(error)
                    throw error
                  }
                  const txReceipt = await wethContract.deposit({ value: `0x${inputAmount.quotient.toString(16)}` })
                  addTransaction(txReceipt, {
                    type: TransactionType.WRAP,
                    unwrapped: false,
                    currencyAmountRaw: inputAmount?.quotient.toString(),
                    chainId,
                  })
                  sendAnalyticsEvent(EventName.WRAP_TOKEN_TXN_SUBMITTED, { ...eventProperties, type: WrapType.WRAP })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
          : WrapInputError.ENTER_NATIVE_AMOUNT,
      }
    } else if (weth.equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                  addTransaction(txReceipt, {
                    type: TransactionType.WRAP,
                    unwrapped: true,
                    currencyAmountRaw: inputAmount?.quotient.toString(),
                    chainId,
                  })
                  sendAnalyticsEvent(EventName.WRAP_TOKEN_TXN_SUBMITTED, { ...eventProperties, type: WrapType.UNWRAP })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
          : WrapInputError.ENTER_WRAPPED_AMOUNT,
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction])
}
