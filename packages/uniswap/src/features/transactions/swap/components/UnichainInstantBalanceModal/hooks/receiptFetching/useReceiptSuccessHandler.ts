import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import { getOutputAmountUsingSwapLogAndFormData } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/getOutputAmountFromSwapLogAndFormData.ts/getOutputAmountFromSwapLogAndFormData'
import {
  NO_OUTPUT_ERROR,
  reportOutputAmount,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/receiptFetching/utils'
import { getOutputAmountUsingOutputTransferLog } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { receiptFromEthersReceipt } from 'uniswap/src/features/transactions/utils/receipt'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebApp } from 'utilities/src/platform'

interface ReceiptSuccessParams {
  receipt: TransactionReceipt
  transaction: TransactionDetails
  methodFetchTime: number
  methodRoundtripTime: number
  isFlashblockTxWithinThreshold?: boolean
  provider: JsonRpcProvider
}

export function useReceiptSuccessHandler(): (params: ReceiptSuccessParams) => Promise<void> {
  const { setScreen } = useTransactionModalContext()
  const dispatch = useDispatch()
  const accountAddress = useWallet().evmAccount?.address
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const derivedSwapInfo = useSwapDependenciesStore((s) => s.derivedSwapInfo)
  const inputAmountFromForm = useSwapDependenciesStore((s) =>
    s.derivedSwapInfo.currencyAmounts.input?.quotient.toString(),
  )
  const outputAmountFromForm = useSwapDependenciesStore((s) =>
    s.derivedSwapInfo.currencyAmounts.output?.quotient.toString(),
  )
  const outputBalanceFromForm = useSwapDependenciesStore((s) => s.derivedSwapInfo.currencyBalances.output)
  const slippageFromForm = derivedSwapInfo.trade.trade?.slippageTolerance
  const exactCurrencyField = derivedSwapInfo.exactCurrencyField
  const outputCurrencyInfo = derivedSwapInfo.currencies.output

  const handleReceiptSuccess = useCallback(
    async ({
      receipt,
      transaction,
      methodFetchTime,
      methodRoundtripTime,
      isFlashblockTxWithinThreshold,
      provider,
    }: ReceiptSuccessParams): Promise<void> => {
      if (!outputCurrencyInfo || !accountAddress) {
        throw new Error('Missing required data for receipt processing')
      }

      if (receipt.status === 0) {
        throw new Error('Transaction reverted')
      }

      if (!receipt.logs.length) {
        throw new Error('No logs found')
      }

      // Record the fetch time when we successfully get a receipt
      // account for estimated RPC ping time
      // updates if the tx is successful so we know to fallback to the form value
      updateSwapForm({ instantReceiptFetchTime: methodFetchTime - methodRoundtripTime })

      // TODO(APPS-8546): move to a saga to avoid anti-pattern
      const parsedReceipt = receiptFromEthersReceipt(receipt, methodFetchTime)
      dispatch(
        updateTransaction({
          ...transaction,
          receipt: parsedReceipt,
          status: TransactionStatus.Success,
          ...(isWebApp && { isFlashblockTxWithinThreshold }),
        }),
      )

      // Try to get output amount from transfer logs first
      const outputAmountFromOutputTransferLog = getOutputAmountUsingOutputTransferLog({
        outputCurrencyInfo,
        receipt,
        accountAddress,
      })

      if (outputAmountFromOutputTransferLog.gt(0)) {
        reportOutputAmount({
          outputAmount: outputAmountFromOutputTransferLog,
          updateSwapForm,
          setScreen,
        })
        return
      }

      // Fallback to swap log analysis for input-exact swaps
      const isInputExact = exactCurrencyField === CurrencyField.INPUT

      if (transaction.typeInfo.type === TransactionType.Swap && isInputExact) {
        const estimatedAmountFromSwapLog = getOutputAmountUsingSwapLogAndFormData({
          inputAmountFromForm: inputAmountFromForm ? BigNumber.from(inputAmountFromForm) : undefined,
          outputAmountFromForm: outputAmountFromForm ? BigNumber.from(outputAmountFromForm) : undefined,
          slippageFromForm: slippageFromForm ?? undefined,
          logs: receipt.logs,
        })

        if (estimatedAmountFromSwapLog?.gt(0)) {
          reportOutputAmount({
            outputAmount: estimatedAmountFromSwapLog,
            updateSwapForm,
            setScreen,
          })
          return
        }
      }

      // Final fallback: Calculate balance delta and subtract gas costs
      if (outputCurrencyInfo.currency.isNative) {
        const isValuePossibleOutput = (value: BigNumber): boolean => {
          if (!slippageFromForm) {
            return false
          }

          const minAcceptable = BigNumber.from(outputAmountFromForm || 0)
            .mul(Math.floor(10_000 - slippageFromForm * 100))
            .div(10_000)
          const maxAcceptable = BigNumber.from(outputAmountFromForm || 0)
            .mul(Math.ceil(10_000 + slippageFromForm * 100))
            .div(10_000)

          return value.gte(minAcceptable) && value.lte(maxAcceptable)
        }

        // Get current balance from subblock
        const currentBalanceHex = await provider.send('eth_getBalance', [accountAddress, 'pending'])
        const currentBalance = BigNumber.from(currentBalanceHex)

        // Calculate gas costs
        const gasUsed = BigNumber.from(receipt.gasUsed)
        const gasPrice = BigNumber.from(receipt.effectiveGasPrice)
        const gasCost = gasUsed.mul(gasPrice)

        // Calculate balance delta and add back gas costs to get the actual output
        const outputFromBalanceDeltaUsingCachedBalance = currentBalance
          .sub(outputBalanceFromForm?.numerator.toString() ?? 0)
          .add(gasCost)

        if (isValuePossibleOutput(outputFromBalanceDeltaUsingCachedBalance)) {
          reportOutputAmount({
            outputAmount: outputFromBalanceDeltaUsingCachedBalance,
            updateSwapForm,
            setScreen,
          })
          return
        }

        const blockBeforeTx = receipt.blockNumber - 1
        const balanceBeforeTxHex = await provider.send('eth_getBalance', [
          accountAddress,
          `0x${blockBeforeTx.toString(16)}`,
        ])
        const balanceBeforeTx = BigNumber.from(balanceBeforeTxHex)

        const outputFromBalanceDeltaUsingRPCBalance = currentBalance.sub(balanceBeforeTx).add(gasCost)

        if (isValuePossibleOutput(outputFromBalanceDeltaUsingRPCBalance)) {
          reportOutputAmount({
            outputAmount: outputFromBalanceDeltaUsingRPCBalance,
            updateSwapForm,
            setScreen,
          })
          return
        }
      }

      throw new Error(NO_OUTPUT_ERROR)
    },
    [
      outputBalanceFromForm,
      outputCurrencyInfo,
      accountAddress,
      updateSwapForm,
      dispatch,
      setScreen,
      exactCurrencyField,
      inputAmountFromForm,
      outputAmountFromForm,
      slippageFromForm,
    ],
  )

  return handleReceiptSuccess
}
