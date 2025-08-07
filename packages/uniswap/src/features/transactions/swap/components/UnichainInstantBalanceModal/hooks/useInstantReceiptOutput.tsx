import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers'
import { useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import {
  FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT,
  FLASHBLOCKS_UI_SKIP_ROUTES,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { getOutputAmountUsingSwapLogAndFormData } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/getOutputAmountFromSwapLogAndFormData.ts/getOutputAmountFromSwapLogAndFormData'
import { useCurrentFlashblocksTransaction } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useCurrentFlashblocksTransaction'
import { getOutputAmountUsingOutputTransferLog } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { isInterface, isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Polls for the flashblock-aware transaction receipt and extracts the output amount.
 * Sets instantOutputCurrencyId and instantOutputAmountRaw on the swap form store once found,
 * then navigates to the Instant Balance modal.
 */
export function useInstantReceiptOutput(): void {
  const { setScreen } = useTransactionModalContext()
  const dispatch = useDispatch()

  const accountAddress = useWallet().evmAccount?.address

  const derivedSwapInfo = useSwapDependenciesStore((s) => s.derivedSwapInfo)
  const chainId = derivedSwapInfo.chainId

  const inputAmountFromForm = useSwapDependenciesStore((s) =>
    s.derivedSwapInfo.currencyAmounts.input?.quotient.toString(),
  )
  const outputAmountFromForm = useSwapDependenciesStore((s) =>
    s.derivedSwapInfo.currencyAmounts.output?.quotient.toString(),
  )
  const slippageFromForm = derivedSwapInfo.trade.trade?.slippageTolerance
  const exactCurrencyField = derivedSwapInfo.exactCurrencyField

  const outputCurrencyInfo = derivedSwapInfo.currencies.output
  const isFlashblocksModalRoute =
    derivedSwapInfo.trade.trade?.routing && !FLASHBLOCKS_UI_SKIP_ROUTES.includes(derivedSwapInfo.trade.trade.routing)

  const { isConfirmed } = useSwapFormStore((s) => ({
    isConfirmed: s.isConfirmed,
  }))

  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  // Choose the right transaction with improved logic and logging
  const transaction: TransactionDetails | undefined = useCurrentFlashblocksTransaction()

  const txHash = transaction?.hash

  const isReceiptPopulatedRef = useRef(false)
  useEffect(() => {
    isReceiptPopulatedRef.current = false
  }, [transaction?.hash])

  const provider = useMemo(() => {
    const rpcUrl = getChainInfo(chainId).rpcUrls[RPCType.Public]?.http[0]
    if (!rpcUrl) {
      return undefined
    }
    return new JsonRpcProvider(rpcUrl)
  }, [chainId])

  useEffect(() => {
    if (
      !isConfirmed ||
      !outputCurrencyInfo ||
      !txHash ||
      !provider ||
      !accountAddress ||
      isReceiptPopulatedRef.current ||
      !isFlashblocksModalRoute
    ) {
      return
    }

    fetchReceipt({
      provider,
      txHash,
      outputCurrencyInfo,
      accountAddress,
      chainId,
      updateSwapForm,
      setScreen,
      transaction,
      dispatch,
      isReceiptPopulatedRef,
      inputAmountFromForm: inputAmountFromForm ? BigNumber.from(inputAmountFromForm) : undefined,
      outputAmountFromForm: outputAmountFromForm ? BigNumber.from(outputAmountFromForm) : undefined,
      slippageFromForm: slippageFromForm ?? undefined,
      exactCurrencyField,
    }).catch((error) => {
      logger.error(error, {
        tags: { file: 'useInstantReceiptOutput', function: 'fetchReceipt' },
      })
    })
  }, [
    isConfirmed,
    txHash,
    provider,
    outputCurrencyInfo,
    accountAddress,
    setScreen,
    chainId,
    updateSwapForm,
    transaction,
    dispatch,
    isFlashblocksModalRoute,
    inputAmountFromForm,
    outputAmountFromForm,
    slippageFromForm,
    exactCurrencyField,
  ])
}

const MAX_RETRIES = 10

async function fetchReceipt({
  provider,
  txHash,
  outputCurrencyInfo,
  accountAddress,
  chainId,
  updateSwapForm,
  setScreen,
  retryCount = 0,
  transaction,
  dispatch,
  isReceiptPopulatedRef,
  inputAmountFromForm,
  outputAmountFromForm,
  slippageFromForm,
  exactCurrencyField,
}: {
  provider: JsonRpcProvider
  txHash: string
  outputCurrencyInfo: CurrencyInfo
  accountAddress: string
  chainId: number
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
  retryCount?: number
  transaction: TransactionDetails | undefined
  dispatch: ReturnType<typeof useDispatch>
  isReceiptPopulatedRef: React.MutableRefObject<boolean>
  inputAmountFromForm?: BigNumber
  outputAmountFromForm?: BigNumber
  slippageFromForm?: number
  exactCurrencyField?: CurrencyField
}): Promise<void> {
  const reportOutputAmount = (outputAmount: BigNumber): void => {
    isReceiptPopulatedRef.current = true

    updateSwapForm({
      instantOutputAmountRaw: outputAmount.toString(),
    })

    setScreen(TransactionScreen.UnichainInstantBalance)
  }

  try {
    // get subblock receipt
    const startTime = Date.now()

    const receipt: TransactionReceipt | undefined = await provider.send('eth_getTransactionReceipt', [txHash])

    // check after async fetch in case another request has already populated the receipt
    if (isReceiptPopulatedRef.current || !transaction) {
      return
    }

    // Record the fetch time when we successfully get a receipt
    const methodFetchTime = Date.now()
    const methodRoundtripTime = methodFetchTime - startTime

    // Calculate if this transaction was completed within the flashblock threshold
    const isFlashblockTxWithinThreshold =
      ('options' in transaction ? transaction.options.rpcSubmissionTimestampMs || 0 : transaction.addedTime || 0) -
        methodFetchTime <=
      FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT

    if (!receipt || !receipt.logs.length) {
      throw new Error('No logs found')
    }

    // account for estimated RPC ping time
    updateSwapForm({ instantReceiptFetchTime: methodFetchTime - methodRoundtripTime })

    // Update the transaction in Redux store with receipt info
    if (accountAddress) {
      // TODO(APPS-8546): move to a saga to avoid anti-pattern
      dispatch(
        updateTransaction({
          ...transaction,
          confirmedTime: methodFetchTime,
          status: TransactionStatus.Success,
          ...(isInterface && { isFlashblockTxWithinThreshold }),
        }),
      )
    }

    const outputAmountFromOutputTransferLog = getOutputAmountUsingOutputTransferLog({
      outputCurrencyInfo,
      receipt,
      accountAddress,
    })

    if (outputAmountFromOutputTransferLog.gt(0)) {
      reportOutputAmount(outputAmountFromOutputTransferLog)
      return
    }

    const isInputExact = exactCurrencyField === CurrencyField.INPUT

    if (transaction.typeInfo.type === TransactionType.Swap && isInputExact) {
      const estimatedAmountFromSwapLog = getOutputAmountUsingSwapLogAndFormData({
        inputAmountFromForm,
        outputAmountFromForm,
        slippageFromForm,
        logs: receipt.logs,
      })

      if (estimatedAmountFromSwapLog?.gt(0)) {
        reportOutputAmount(estimatedAmountFromSwapLog)
        return
      }
    }

    throw new Error('No output amount found in receipt logs')
  } catch (e) {
    logger.error(e, {
      tags: { file: 'useInstantReceiptOutput', function: 'fetchReceipt' },
    })

    if (retryCount < MAX_RETRIES) {
      setTimeout(
        () =>
          fetchReceipt({
            provider,
            txHash,
            outputCurrencyInfo,
            accountAddress,
            chainId,
            updateSwapForm,
            setScreen,
            retryCount: retryCount + 1,
            transaction,
            dispatch,
            isReceiptPopulatedRef,
            inputAmountFromForm,
            outputAmountFromForm,
            slippageFromForm,
            exactCurrencyField,
          }),
        (getChainInfo(chainId).subblockTimeMs || ONE_SECOND_MS) / (isMobileApp ? 2 : 4),
      )
      return
    } else {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: '',
        isSubmitting: false,
        showPendingUI: false,
        isConfirmed: false,
        instantOutputAmountRaw: undefined,
        instantReceiptFetchTime: undefined,
        txHash: undefined,
        txHashReceivedTime: undefined,
      })
      setScreen(TransactionScreen.Form)
    }
  }
}
