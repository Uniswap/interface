// TODO(MOB-204): reduce file length
/* eslint-disable max-lines */
import { MaxUint256 } from '@ethersproject/constants'
import { SwapEventName } from '@uniswap/analytics-events'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { FlatFeeOptions, UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeOptions } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnyAction } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { selectSwapStartTimestamp } from 'src/features/telemetry/timing/selectors'
import { updateSwapStartTimestamp } from 'src/features/telemetry/timing/slice'
import {
  getBaseTradeAnalyticsProperties,
  getBaseTradeAnalyticsPropertiesFromSwapInfo,
} from 'src/features/transactions/swap/analytics'
import { swapActions } from 'src/features/transactions/swap/swapSaga'
import {
  getSwapMethodParameters,
  getWrapType,
  isWrapAction,
  requireAcceptNewTrade,
  sumGasFees,
} from 'src/features/transactions/swap/utils'
import { getWethContract, tokenWrapActions } from 'src/features/transactions/swap/wrapSaga'
import {
  updateExactAmountFiat,
  updateExactAmountToken,
} from 'src/features/transactions/transactionState/transactionState'
import { toStringish } from 'src/utils/number'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { useAsyncData, usePrevious } from 'utilities/src/react/hooks'
import ERC20_ABI from 'wallet/src/abis/erc20.json'
import { Erc20 } from 'wallet/src/abis/types'
import { ChainId } from 'wallet/src/constants/chains'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasFeeResult, GasSpeed, SimulatedGasEstimationInfo } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useOnChainCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { useSimulatedGasLimit } from 'wallet/src/features/routing/hooks'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
  useUSDCValue,
} from 'wallet/src/features/routing/useUSDCPrice'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import {
  PermitSignatureInfo,
  usePermit2Signature,
} from 'wallet/src/features/transactions/swap/usePermit2Signature'
import {
  Trade,
  useSetTradeSlippage,
  useTrade,
} from 'wallet/src/features/transactions/swap/useTrade'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import {
  TransactionDetails,
  TransactionType,
  WrapType,
} from 'wallet/src/features/transactions/types'
import { useContractManager, useProvider } from 'wallet/src/features/wallet/context'
import {
  useActiveAccount,
  useActiveAccountAddressWithThrow,
} from 'wallet/src/features/wallet/hooks'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'
import { DerivedSwapInfo } from './types'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo(state: TransactionState): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField = CurrencyField.INPUT,
    selectingCurrencyField,
    txId,
    customSlippageTolerance,
  } = state

  const activeAccount = useActiveAccount()

  const currencyInInfo = useCurrencyInfo(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn.address) : undefined
  )

  const currencyOutInfo = useCurrencyInfo(
    currencyAssetOut
      ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut.address)
      : undefined
  )

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyInInfo,
      [CurrencyField.OUTPUT]: currencyOutInfo,
    }
  }, [currencyInInfo, currencyOutInfo])

  const currencyIn = currencyInInfo?.currency
  const currencyOut = currencyOutInfo?.currency

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? ChainId.Mainnet

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currencyIn, activeAccount?.address)
  const { balance: tokenOutBalance } = useOnChainCurrencyBalance(
    currencyOut,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  const otherCurrency = isExactIn ? currencyOut : currencyIn
  const exactCurrency = isExactIn ? currencyIn : currencyOut

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(() => {
    return getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency: exactCurrency,
    })
  }, [exactAmountToken, exactCurrency])

  const shouldGetQuote = !isWrapAction(wrapType)

  const sendPortionEnabled = useFeatureFlag(FEATURE_FLAGS.PortionFields)

  // Fetch the trade quote. If customSlippageTolerance is undefined, then the quote is fetched with MAX_AUTO_SLIPPAGE_TOLERANCE
  const tradeWithoutSlippage = useTrade({
    amountSpecified: shouldGetQuote ? amountSpecified : null,
    otherCurrency,
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    customSlippageTolerance,
    sendPortionEnabled,
  })

  // Calculate auto slippage tolerance for trade. If customSlippageTolerance is undefined, then the Trade slippage is set to the calculated value.
  const { trade, autoSlippageTolerance } = useSetTradeSlippage(
    tradeWithoutSlippage,
    customSlippageTolerance
  )

  const currencyAmounts = useMemo(
    () =>
      shouldGetQuote
        ? {
            [CurrencyField.INPUT]:
              exactCurrencyField === CurrencyField.INPUT
                ? amountSpecified
                : trade.trade?.inputAmount,
            [CurrencyField.OUTPUT]:
              exactCurrencyField === CurrencyField.OUTPUT
                ? amountSpecified
                : trade.trade?.outputAmount,
          }
        : {
            [CurrencyField.INPUT]: amountSpecified,
            [CurrencyField.OUTPUT]: amountSpecified,
          },
    [
      amountSpecified,
      exactCurrencyField,
      shouldGetQuote,
      trade.trade?.inputAmount,
      trade.trade?.outputAmount,
    ]
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  const currencyAmountsUSDValue = useMemo(() => {
    return {
      [CurrencyField.INPUT]: inputCurrencyUSDValue,
      [CurrencyField.OUTPUT]: outputCurrencyUSDValue,
    }
  }, [inputCurrencyUSDValue, outputCurrencyUSDValue])

  const currencyBalances = useMemo(() => {
    return {
      [CurrencyField.INPUT]: tokenInBalance,
      [CurrencyField.OUTPUT]: tokenOutBalance,
    }
  }, [tokenInBalance, tokenOutBalance])

  return useMemo(() => {
    return {
      chainId,
      currencies,
      currencyAmounts,
      currencyAmountsUSDValue,
      currencyBalances,
      exactAmountToken,
      exactAmountFiat,
      exactCurrencyField,
      focusOnCurrencyField,
      trade,
      wrapType,
      selectingCurrencyField,
      txId,
      autoSlippageTolerance,
      customSlippageTolerance,
    }
  }, [
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyAmountsUSDValue,
    exactAmountToken,
    exactAmountFiat,
    exactCurrencyField,
    focusOnCurrencyField,
    selectingCurrencyField,
    trade,
    txId,
    wrapType,
    autoSlippageTolerance,
    customSlippageTolerance,
  ])
}

export function useUSDTokenUpdater(
  dispatch: React.Dispatch<AnyAction>,
  isFiatInput: boolean,
  exactAmountToken: string,
  exactAmountFiat: string,
  exactCurrency?: Currency
): void {
  const price = useUSDCPrice(exactCurrency)
  const shouldUseUSDRef = useRef(isFiatInput)
  const { convertFiatAmount, formatCurrencyAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount().amount

  useEffect(() => {
    shouldUseUSDRef.current = isFiatInput
  }, [isFiatInput])

  useEffect(() => {
    if (!exactCurrency || !price) return

    const exactAmountUSD = (parseFloat(exactAmountFiat) / conversionRate).toFixed(NUM_DECIMALS_USD)

    if (shouldUseUSDRef.current) {
      const stablecoinAmount = getCurrencyAmount({
        value: exactAmountUSD,
        valueType: ValueType.Exact,
        currency: STABLECOIN_AMOUNT_OUT[exactCurrency.chainId]?.currency,
      })

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined

      return dispatch(
        updateExactAmountToken({
          amount: formatCurrencyAmount({
            value: currencyAmount,
            type: NumberType.SwapTradeAmount,
            placeholder: '',
          }),
        })
      )
    }

    const exactCurrencyAmount = getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency: exactCurrency,
    })
    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = parseFloat(usdPrice?.toExact() ?? '0') * conversionRate

    return dispatch(
      updateExactAmountFiat({ amount: fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0' })
    )
  }, [
    dispatch,
    shouldUseUSDRef,
    exactAmountFiat,
    exactAmountToken,
    exactCurrency,
    price,
    conversionRate,
    formatCurrencyAmount,
  ])
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // not enough allowance and token cannot be approved through .permit instead
  Approve = 'approve',

  // not enough allowance but token can be approved through permit signature
  Permit = 'permit',

  Permit2Approve = 'permit2-approve',
}

type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit
      txRequest: null
    }
  | {
      action: ApprovalAction.Approve | ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
    }

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

function useWrapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo
): providers.TransactionRequest | undefined {
  const address = useActiveAccountAddressWithThrow()
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo
  const provider = useProvider(chainId)

  const transactionFetcher = useCallback(() => {
    if (!provider || wrapType === WrapType.NotApplicable) return

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
  if (!currencyAmountIn) return

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
    if (!provider || !currencyInAmount || !currencyInAmount.currency) return

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
  if (wrapType !== WrapType.NotApplicable) return { action: ApprovalAction.None, txRequest: null }

  const currencyIn = currencyInAmount.currency
  // native tokens do not need approvals
  if (currencyIn.isNative) return { action: ApprovalAction.None, txRequest: null }

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
  if (!trade?.swapFee?.recipient) return undefined

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

export function useSwapTxAndGasInfo({
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

    if (simulatedGasEstimateError) {
      const simulationError =
        typeof simulatedGasEstimationInfo.error === 'boolean'
          ? new Error('Unknown gas simulation error')
          : simulatedGasEstimateError

      logger.error(simulationError, {
        tags: { file: 'swap/hooks', function: 'useSwapTxAndGasInfo' },
        extra: {
          requestId: simulatedGasEstimateRequestId,
          quoteId: simulatedGasEstimateQuoteId,
        },
      })
      sendMobileAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo(derivedSwapInfo, formatter),
        error: simulationError.toString(),
        txRequest: transactionRequest,
      })
    }

    if (swapGasFee.error) {
      logger.error(swapGasFee.error, {
        tags: { file: 'swap/hooks', function: 'useSwapTxAndGasInfo' },
      })
      sendMobileAnalyticsEvent(SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED, {
        ...getBaseTradeAnalyticsPropertiesFromSwapInfo(derivedSwapInfo, formatter),
        error: swapGasFee.error.toString(),
        txRequest: transactionRequest,
      })
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
    if (!transactionRequest || !swapGasFee.params) return

    return { ...transactionRequest, ...swapGasFee.params }
  }, [transactionRequest, swapGasFee])

  const approveLoading = !tokenApprovalInfo || approveGasFee.loading

  const approveTxWithGasSettings = useMemo((): providers.TransactionRequest | undefined => {
    if (!tokenApprovalInfo?.txRequest || !approveGasFee?.params) return

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

/** Callback to submit trades and track progress */
export function useSwapCallback(
  approveTxRequest: providers.TransactionRequest | undefined,
  swapTxRequest: providers.TransactionRequest | undefined,
  gasFee: GasFeeResult,
  trade: Trade | null | undefined,
  currencyInAmountUSD: Maybe<CurrencyAmount<Currency>>,
  currencyOutAmountUSD: Maybe<CurrencyAmount<Currency>>,
  isAutoSlippage: boolean,
  onSubmit: () => void,
  txId?: string,
  isHoldToSwap?: boolean
): () => void {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()
  const formatter = useLocalizationContext()

  const swapStartTimestamp = useAppSelector(selectSwapStartTimestamp)

  return useMemo(() => {
    if (!account || !swapTxRequest || !trade || !gasFee.value) {
      return () => {
        logger.error('Attempted swap with missing required parameters', {
          tags: {
            file: 'swap/hooks',
            function: 'useSwapCallback',
          },
          extra: { account, swapTxRequest, trade, gasFee },
        })
      }
    }

    return () => {
      appDispatch(
        swapActions.trigger({
          txId,
          account,
          trade,
          currencyInAmountUSD,
          currencyOutAmountUSD,
          approveTxRequest,
          swapTxRequest,
        })
      )
      onSubmit()

      sendMobileAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
        ...getBaseTradeAnalyticsProperties(formatter, trade),
        estimated_network_fee_wei: gasFee.value,
        gas_limit: toStringish(swapTxRequest.gasLimit),
        token_in_amount_usd: currencyInAmountUSD
          ? parseFloat(currencyInAmountUSD.toFixed(2))
          : undefined,
        token_out_amount_usd: currencyOutAmountUSD
          ? parseFloat(currencyOutAmountUSD.toFixed(2))
          : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: trade.quote?.blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp
          ? Date.now() - swapStartTimestamp
          : undefined,
        is_hold_to_swap: isHoldToSwap,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    }
  }, [
    account,
    swapTxRequest,
    trade,
    gasFee,
    appDispatch,
    txId,
    currencyInAmountUSD,
    currencyOutAmountUSD,
    approveTxRequest,
    onSubmit,
    formatter,
    isAutoSlippage,
    swapStartTimestamp,
    isHoldToSwap,
  ])
}

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType,
  onSuccess: () => void,
  txRequest?: providers.TransactionRequest,
  txId?: string
): {
  wrapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  return useMemo(() => {
    if (!isWrapAction(wrapType)) {
      return {
        wrapCallback: (): void =>
          logger.error('Attempted wrap on a non-wrap transaction', {
            tags: {
              file: 'swap/hooks',
              function: 'useWrapCallback',
            },
          }),
      }
    }

    if (!account || !inputCurrencyAmount || !txRequest) {
      return {
        wrapCallback: (): void =>
          logger.error('Attempted wrap with missing required parameters', {
            tags: {
              file: 'swap/hooks',
              function: 'useWrapCallback',
            },
            extra: { account, inputCurrencyAmount, txRequest },
          }),
      }
    }

    return {
      wrapCallback: (): void => {
        appDispatch(
          tokenWrapActions.trigger({
            account,
            inputCurrencyAmount,
            txId,
            txRequest,
          })
        )
        onSuccess()
      },
    }
  }, [txId, account, appDispatch, inputCurrencyAmount, wrapType, txRequest, onSuccess])
}

// The first trade shown to the user is implicitly accepted but every subsequent update to
// the trade params require an explicit user approval
export function useAcceptedTrade({ derivedSwapInfo }: { derivedSwapInfo?: DerivedSwapInfo }): {
  onAcceptTrade: () => undefined
  acceptedDerivedSwapInfo?: DerivedSwapInfo
  newTradeRequiresAcceptance: boolean
} {
  const [acceptedDerivedSwapInfo, setAcceptedDerivedSwapInfo] = useState<DerivedSwapInfo>()

  const trade = derivedSwapInfo?.trade.trade
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  const newTradeRequiresAcceptance = requireAcceptNewTrade(acceptedTrade, trade)

  useEffect(() => {
    if (!trade || trade === acceptedTrade) return

    // auto-accept: 1) first valid trade for the user or 2) new trade if price movement is below threshold
    if (!acceptedTrade || !newTradeRequiresAcceptance) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
    }
  }, [trade, acceptedTrade, newTradeRequiresAcceptance, derivedSwapInfo])

  const onAcceptTrade = (): undefined => {
    if (!trade) return undefined

    setAcceptedDerivedSwapInfo(derivedSwapInfo)
  }

  return {
    onAcceptTrade,
    acceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  }
}

export function useShowSwapNetworkNotification(chainId?: ChainId): void {
  const prevChainId = usePrevious(chainId)
  const appDispatch = useAppDispatch()
  useEffect(() => {
    // don't fire notification toast for first network selection
    if (!prevChainId || !chainId || prevChainId === chainId) return

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
