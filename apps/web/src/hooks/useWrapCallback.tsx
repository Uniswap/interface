import { Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useWETHContract } from 'hooks/useContract'
import { formatToDecimal, getTokenAddress } from 'lib/utils/analytics'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo, useRef, useState } from 'react'
import { useCurrencyBalance } from 'state/connection/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useTransactionAdder } from 'state/transactions/hooks'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { logger } from 'utilities/src/logger/logger'

const NOT_APPLICABLE = { wrapType: WrapType.NotApplicable }

enum WrapInputError {
  NO_ERROR = 0, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT = 1,
  ENTER_WRAPPED_AMOUNT = 2,
  INSUFFICIENT_NATIVE_BALANCE = 3,
  INSUFFICIENT_WRAPPED_BALANCE = 4,
}

/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback({
  inputCurrency,
  outputCurrency,
  typedValue,
}: {
  inputCurrency?: Currency | null
  outputCurrency?: Currency | null
  typedValue?: string
}): { wrapType: WrapType; execute?: () => Promise<string | undefined>; inputError?: WrapInputError } {
  const account = useAccount()
  const { chainId } = useMultichainContext()

  const wethContract = useWETHContract(true, chainId)
  const wethContractRef = useRef(wethContract)
  wethContractRef.current = wethContract

  const balance = useCurrencyBalance(account.address, inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue],
  )
  const addTransaction = useTransactionAdder()

  // This allows an async error to propagate within the React lifecycle.
  // Without rethrowing it here, it would not show up in the UI - only the dev console.
  const [error, setError] = useState<Error>()
  if (error) {
    throw error
  }

  return useMemo(() => {
    if (!wethContractRef.current || !chainId || !inputCurrency || !outputCurrency) {
      return NOT_APPLICABLE
    }
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    if (!weth) {
      return NOT_APPLICABLE
    }

    const hasInputAmount = Boolean(inputAmount?.greaterThan('0'))
    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const eventProperties = {
      token_in_address: getTokenAddress(inputCurrency),
      token_out_address: getTokenAddress(outputCurrency),
      token_in_symbol: inputCurrency.symbol,
      token_out_symbol: outputCurrency.symbol,
      chain_id: inputCurrency.chainId,
      amount: inputAmount ? formatToDecimal(inputAmount, inputAmount.currency.decimals) : undefined,
    }

    if (inputCurrency.isNative && weth.equals(outputCurrency)) {
      return {
        wrapType: WrapType.Wrap,
        execute: sufficientBalance
          ? async () => {
              const wethContract = wethContractRef.current
              if (!wethContract) {
                throw new Error('wethContract is null')
              }
              const network = await wethContract.provider.getNetwork()
              if (
                network.chainId !== chainId ||
                wethContract.address !== WRAPPED_NATIVE_CURRENCY[network.chainId]?.address
              ) {
                sendAnalyticsEvent(InterfaceEventName.WrapTokenTxnInvalidated, {
                  ...eventProperties,
                  contract_address: wethContract.address,
                  contract_chain_id: network.chainId,
                  type: WrapType.Wrap,
                })
                const error = new Error(`Invalid WETH contract
Please file a bug detailing how this happened - https://github.com/Uniswap/interface/issues/new?labels=bug&template=bug-report.md&title=Invalid%20WETH%20contract`)
                setError(error)
                throw error
              }
              const txReceipt = await wethContract.deposit({ value: `0x${inputAmount.quotient.toString(16)}` })
              addTransaction(txReceipt, {
                type: TransactionType.Wrap,
                unwrapped: false,
                currencyAmountRaw: inputAmount.quotient.toString(),
              })
              sendAnalyticsEvent(InterfaceEventName.WrapTokenTxnSubmitted, {
                ...eventProperties,
                transaction_hash: txReceipt.hash,
                type: WrapType.Wrap,
              })
              return txReceipt.hash
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
        wrapType: WrapType.Unwrap,
        execute: sufficientBalance
          ? async () => {
              try {
                const wethContract = wethContractRef.current
                if (!wethContract) {
                  throw new Error('wethContract is null')
                }
                const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                addTransaction(txReceipt, {
                  type: TransactionType.Wrap,
                  unwrapped: true,
                  currencyAmountRaw: inputAmount.quotient.toString(),
                })
                sendAnalyticsEvent(InterfaceEventName.WrapTokenTxnSubmitted, {
                  ...eventProperties,
                  transaction_hash: txReceipt.hash,
                  type: WrapType.Unwrap,
                })
                return txReceipt.hash
              } catch (error) {
                logger.warn('useWrapCallback', 'useWrapCallback', 'Failed to wrap', error)
                throw error
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
  }, [chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction])
}
