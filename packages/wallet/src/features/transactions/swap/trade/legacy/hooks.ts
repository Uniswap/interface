import { MaxUint256 } from '@ethersproject/constants'
import { SwapEventName } from '@uniswap/analytics-events'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FlatFeeOptions, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { useCallback, useEffect, useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20 } from 'uniswap/src/abis/types'
import { logger } from 'utilities/src/logger/logger'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { useAsyncData, usePrevious } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed, SimulatedGasEstimationInfo } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import { getBaseTradeAnalyticsPropertiesFromSwapInfo } from 'wallet/src/features/transactions/swap/analytics'
import { NO_QUOTE_DATA } from 'wallet/src/features/transactions/swap/trade/legacy/api'
import { useSimulatedGasLimit } from 'wallet/src/features/transactions/swap/trade/legacy/hooks/useSimulatedGasLimit'
import {
  ApprovalAction,
  TokenApprovalInfo,
  Trade,
} from 'wallet/src/features/transactions/swap/trade/types'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import {
  PermitSignatureInfo,
  usePermit2Signature,
} from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { getSwapMethodParameters, sumGasFees } from 'wallet/src/features/transactions/swap/utils'
import { getWethContract } from 'wallet/src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  TransactionDetails,
  TransactionType,
  WrapType,
} from 'wallet/src/features/transactions/types'
import { useContractManager, useProvider } from 'wallet/src/features/wallet/context'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

interface TransactionRequestInfo {
  transactionRequest: providers.TransactionRequest | undefined
}

interface Permit2SignatureInfo {
  data?: PermitSignatureInfo
  isLoading: boolean
}

function useTransactionRequestInfo(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo: TokenApprovalInfo | undefined,
  simulatedGasEstimationInfo: SimulatedGasEstimationInfo,
  permit2SignatureInfo: Permit2SignatureInfo
): TransactionRequestInfo {
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)
  const swapTxRequest = useSwapTransactionRequest(
    derivedSwapInfo,
    tokenApprovalInfo,
    simulatedGasEstimationInfo,
    permit2SignatureInfo
  )
  const isWrapApplicable = derivedSwapInfo.wrapType !== WrapType.NotApplicable
  return {
    transactionRequest: isWrapApplicable ? wrapTxRequest : swapTxRequest.transactionRequest,
  }
}

export function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo
): providers.TransactionRequest | undefined {
  const address = useActiveAccountAddressWithThrow()
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo
  const provider = useProvider(chainId)

  const transactionFetcher = useCallback(() => {
    if (!provider || wrapType === WrapType.NotApplicable) {
      return
    }

    return getWrapTransactionRequest(
      provider,
      chainId,
      address,
      wrapType,
      currencyAmounts[CurrencyField.INPUT]
    )
  }, [address, chainId, wrapType, currencyAmounts, provider])

  return useAsyncData(transactionFetcher).data
}

const getWrapTransactionRequest = async (
  provider: providers.Provider,
  chainId: ChainId,
  address: Address,
  wrapType: WrapType,
  currencyAmountIn: Maybe<CurrencyAmount<Currency>>
): Promise<providers.TransactionRequest | undefined> => {
  if (!currencyAmountIn) {
    return
  }

  const wethContract = await getWethContract(chainId, provider)
  const wethTx =
    wrapType === WrapType.Wrap
      ? await wethContract.populateTransaction.deposit({
          value: `0x${currencyAmountIn.quotient.toString(16)}`,
        })
      : await wethContract.populateTransaction.withdraw(
          `0x${currencyAmountIn.quotient.toString(16)}`
        )

  return { ...wethTx, from: address, chainId }
}

const MAX_APPROVE_AMOUNT = MaxUint256
function useTokenApprovalInfo(
  chainId: ChainId,
  wrapType: WrapType,
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
): TokenApprovalInfo | undefined {
  const address = useActiveAccountAddressWithThrow()
  const provider = useProvider(chainId)
  const contractManager = useContractManager()

  const transactionFetcher = useCallback(() => {
    if (!provider || !currencyInAmount || !currencyInAmount.currency) {
      return
    }

    return getTokenPermit2ApprovalInfo(
      provider,
      contractManager,
      address,
      wrapType,
      currencyInAmount
    )
  }, [address, contractManager, currencyInAmount, provider, wrapType])

  return useAsyncData(transactionFetcher).data
}

const getTokenPermit2ApprovalInfo = async (
  provider: providers.Provider,
  contractManager: ContractManager,
  address: Address,
  wrapType: WrapType,
  currencyInAmount: CurrencyAmount<Currency>
): Promise<TokenApprovalInfo | undefined> => {
  // wrap/unwraps do not need approval
  if (wrapType !== WrapType.NotApplicable) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  const currencyIn = currencyInAmount.currency
  // native tokens do not need approvals
  if (currencyIn.isNative) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  const currencyInAmountRaw = currencyInAmount.quotient.toString()
  const chainId = currencyInAmount.currency.chainId
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    currencyIn.address,
    provider,
    ERC20_ABI
  )

  const allowance = await tokenContract.callStatic.allowance(address, PERMIT2_ADDRESS)
  if (!allowance.lt(currencyInAmountRaw)) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  let baseTransaction
  try {
    baseTransaction = await tokenContract.populateTransaction.approve(
      PERMIT2_ADDRESS,
      // max approve on Permit2 since this method costs gas and we don't want users
      // to have to pay approval gas on every tx
      MAX_APPROVE_AMOUNT,
      { from: address }
    )
  } catch {
    // above call errors when token restricts max approvals
    baseTransaction = await tokenContract.populateTransaction.approve(
      PERMIT2_ADDRESS,
      currencyInAmountRaw,
      { from: address }
    )
  }

  return {
    txRequest: { ...baseTransaction, from: address, chainId },
    action: ApprovalAction.Permit2Approve,
  }
}

type Fee = { feeOptions: FeeOptions } | { flatFeeOptions: FlatFeeOptions }

function getFees(trade: Trade<Currency, Currency, TradeType> | undefined): Fee | undefined {
  if (!trade?.swapFee?.recipient) {
    return undefined
  }

  if (trade.tradeType === TradeType.EXACT_INPUT) {
    return { feeOptions: { fee: trade.swapFee.percent, recipient: trade.swapFee.recipient } }
  }

  return {
    flatFeeOptions: {
      amount: trade.swapFee.amount,
      recipient: trade.swapFee.recipient,
    },
  }
}

function useSwapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo: TokenApprovalInfo | undefined,
  simulatedGasEstimationInfo: SimulatedGasEstimationInfo,
  permit2SignatureInfo: Permit2SignatureInfo
): TransactionRequestInfo {
  const {
    chainId,
    trade: { trade },
    wrapType,
    currencyAmounts,
  } = derivedSwapInfo

  const address = useActiveAccountAddressWithThrow()

  const { data: permit2Signature, isLoading: permit2InfoLoading } = permit2SignatureInfo

  // get simulated gasLimit only if token doesn't have enough allowance AND we can't get the allowance
  // through .permit instead
  const shouldFetchSimulatedGasLimit =
    tokenApprovalInfo?.action === ApprovalAction.Approve ||
    tokenApprovalInfo?.action === ApprovalAction.Permit2Approve

  const { loading: simulatedGasLimitLoading, simulatedGasLimit } = simulatedGasEstimationInfo

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  return useMemo(() => {
    if (
      wrapType !== WrapType.NotApplicable ||
      !currencyAmountIn ||
      !tokenApprovalInfo ||
      (!simulatedGasLimit && simulatedGasLimitLoading) ||
      permit2InfoLoading ||
      !trade
    ) {
      return { transactionRequest: undefined }
    }

    // if the swap transaction does not require a Tenderly gas limit simulation, submit "undefined" here
    // so that ethers can calculate the gasLimit later using .estimateGas(tx) instead
    const gasLimit = shouldFetchSimulatedGasLimit ? simulatedGasLimit : undefined
    const { calldata, value } = getSwapMethodParameters({
      permit2Signature,
      trade,
      address,
      ...getFees(trade),
    })

    const transactionRequest = {
      from: address,
      to: UNIVERSAL_ROUTER_ADDRESS(chainId),
      gasLimit,
      chainId,
      data: calldata,
      value,
    }

    return { transactionRequest }
  }, [
    address,
    chainId,
    currencyAmountIn,
    permit2InfoLoading,
    permit2Signature,
    shouldFetchSimulatedGasLimit,
    simulatedGasLimit,
    simulatedGasLimitLoading,
    tokenApprovalInfo,
    trade,
    wrapType,
  ])
}

interface SwapTxAndGasInfo {
  txRequest?: providers.TransactionRequest
  approveTxRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
}

export function useSwapTxAndGasInfoLegacy({
  derivedSwapInfo,
  skipGasFeeQuery,
}: {
  derivedSwapInfo: DerivedSwapInfo
  skipGasFeeQuery: boolean
}): SwapTxAndGasInfo {
  const formatter = useLocalizationContext()
  const { chainId, wrapType, currencyAmounts, currencies, exactCurrencyField } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo(
    chainId,
    wrapType,
    currencyAmounts[CurrencyField.INPUT]
  )

  const permit2SignatureInfo = usePermit2Signature(currencyAmounts[CurrencyField.INPUT])

  const [otherCurrency, tradeType] =
    exactCurrencyField === CurrencyField.INPUT
      ? [currencies[CurrencyField.OUTPUT]?.currency, TradeType.EXACT_INPUT]
      : [currencies[CurrencyField.INPUT]?.currency, TradeType.EXACT_OUTPUT]

  // get simulated gasLimit only if token doesn't have enough allowance AND we can't get the allowance
  // through .permit instead
  const shouldFetchSimulatedGasLimit =
    tokenApprovalInfo?.action === ApprovalAction.Approve ||
    tokenApprovalInfo?.action === ApprovalAction.Permit2Approve

  const simulatedGasEstimationInfo = useSimulatedGasLimit(
    currencyAmounts[exactCurrencyField],
    otherCurrency,
    tradeType,
    /* skip */ !shouldFetchSimulatedGasLimit,
    permit2SignatureInfo.data,
    derivedSwapInfo.customSlippageTolerance
  )

  const { transactionRequest } = useTransactionRequestInfo(
    derivedSwapInfo,
    tokenApprovalInfo,
    simulatedGasEstimationInfo,
    permit2SignatureInfo
  )

  const approveGasFee = useTransactionGasFee(
    tokenApprovalInfo?.txRequest,
    GasSpeed.Urgent,
    skipGasFeeQuery
  )

  const swapGasFee = useTransactionGasFee(transactionRequest, GasSpeed.Urgent, skipGasFeeQuery)

  useEffect(() => {
    const {
      error: simulatedGasEstimateError,
      quoteId: simulatedGasEstimateQuoteId,
      requestId: simulatedGasEstimateRequestId,
    } = simulatedGasEstimationInfo

    if (swapGasFee.error && simulatedGasEstimateError) {
      if (shouldFetchSimulatedGasLimit) {
        const simulationError =
          typeof simulatedGasEstimateError === 'boolean'
            ? new Error('Unknown gas simulation error')
            : simulatedGasEstimateError

        const isNoQuoteDataError =
          'message' in simulationError && simulationError.message === NO_QUOTE_DATA

        // We do not want to log to Sentry if it's a liquidity error.
        if (!isNoQuoteDataError) {
          logger.error(simulationError, {
            tags: { file: 'swap/hooks', function: 'useSwapTxAndGasInfo' },
            extra: {
              requestId: simulatedGasEstimateRequestId,
              quoteId: simulatedGasEstimateQuoteId,
            },
          })
        }

        sendWalletAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
          error: simulationError.toString(),
          txRequest: transactionRequest,
        })
      } else {
        logger.error(swapGasFee.error, {
          tags: { file: 'swap/hooks', function: 'useSwapTxAndGasInfo' },
        })

        sendWalletAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
          ...getBaseTradeAnalyticsPropertiesFromSwapInfo({ derivedSwapInfo, formatter }),
          error: swapGasFee.error.toString(),
          txRequest: transactionRequest,
        })
      }
    }
  }, [
    derivedSwapInfo,
    transactionRequest,
    shouldFetchSimulatedGasLimit,
    simulatedGasEstimationInfo,
    swapGasFee.error,
    formatter,
  ])

  const txRequestWithGasSettings = useMemo((): providers.TransactionRequest | undefined => {
    if (!transactionRequest || !swapGasFee.params) {
      return
    }

    return { ...transactionRequest, ...swapGasFee.params }
  }, [transactionRequest, swapGasFee])

  const approveLoading = !tokenApprovalInfo || approveGasFee.loading

  const approveTxWithGasSettings = useMemo((): providers.TransactionRequest | undefined => {
    if (!tokenApprovalInfo?.txRequest || !approveGasFee?.params) {
      return
    }

    return {
      ...tokenApprovalInfo.txRequest,
      ...approveGasFee?.params,
    }
  }, [tokenApprovalInfo?.txRequest, approveGasFee?.params])

  const totalGasFee = sumGasFees(approveGasFee?.value, swapGasFee?.value)

  const error = shouldFetchSimulatedGasLimit ? simulatedGasEstimationInfo.error : swapGasFee.error

  const gasFee = useMemo(
    () => ({
      value: totalGasFee,
      loading:
        approveLoading ||
        (shouldFetchSimulatedGasLimit && simulatedGasEstimationInfo.loading) ||
        swapGasFee.loading,
      error,
    }),
    [
      approveLoading,
      error,
      shouldFetchSimulatedGasLimit,
      simulatedGasEstimationInfo.loading,
      swapGasFee.loading,
      totalGasFee,
    ]
  )

  return {
    txRequest: txRequestWithGasSettings,
    approveTxRequest: approveTxWithGasSettings,
    gasFee,
  }
}

export function useShowSwapNetworkNotification(chainId?: ChainId): void {
  const prevChainId = usePrevious(chainId)
  const appDispatch = useAppDispatch()
  useEffect(() => {
    // don't fire notification toast for first network selection
    if (!prevChainId || !chainId || prevChainId === chainId) {
      return
    }

    appDispatch(
      pushNotification({ type: AppNotificationType.SwapNetwork, chainId, hideDelay: 2000 })
    )
  }, [chainId, prevChainId, appDispatch])
}

export function useMostRecentSwapTx(address: Address): TransactionDetails | undefined {
  const transactions = useAppSelector(selectTransactions)
  const addressTransactions = transactions[address]
  if (addressTransactions) {
    return flattenObjectOfObjects(addressTransactions)
      .filter((tx) => tx.typeInfo.type === TransactionType.Swap)
      .sort((a, b) => b.addedTime - a.addedTime)[0]
  }
}
