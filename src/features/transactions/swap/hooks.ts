import { MaxUint256 } from '@ethersproject/constants'
import { SwapRouter } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, NativeCurrency, Percent, TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnyAction } from 'redux'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { useAppDispatch } from 'src/app/hooks'
import { useContractManager, useProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { useTransactionGasFee } from 'src/features/gas/hooks'
import { GasSpeed } from 'src/features/gas/types'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { useSimulatedGasLimit } from 'src/features/routing/hooks'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
  useUSDCValue,
} from 'src/features/routing/useUSDCPrice'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { PERMITTABLE_TOKENS } from 'src/features/transactions/permit/permittableTokens'
import { usePermitSignature } from 'src/features/transactions/permit/usePermitSignature'
import { swapActions } from 'src/features/transactions/swap/swapSaga'
import { Trade, useTrade } from 'src/features/transactions/swap/useTrade'
import { getWrapType, isWrapAction, sumGasFees } from 'src/features/transactions/swap/utils'
import {
  getWethContract,
  tokenWrapActions,
  tokenWrapSagaName,
  WrapType,
} from 'src/features/transactions/swap/wrapSaga'
import {
  CurrencyField,
  TransactionState,
  transactionStateActions,
  updateExactAmountToken,
  updateExactAmountUSD,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { useActiveAccount, useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { buildCurrencyId, currencyAddress } from 'src/utils/currencyId'
import { useAsyncData, usePrevious } from 'src/utils/hooks'
import { logger } from 'src/utils/logger'
import { SagaStatus } from 'src/utils/saga'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'
import { useSagaStatus } from 'src/utils/useSagaStatus'

export const DEFAULT_SLIPPAGE_TOLERANCE_PERCENT = new Percent(DEFAULT_SLIPPAGE_TOLERANCE, 100)
const NUM_CURRENCY_SIG_FIGS = 6
const NUM_USD_DECIMALS_DISPLAY = 2

export type DerivedSwapInfo<
  TInput = Currency,
  TOutput extends Currency = Currency
> = BaseDerivedInfo<TInput> & {
  chainId: ChainId
  currencies: BaseDerivedInfo<TInput>['currencies'] & {
    [CurrencyField.OUTPUT]: NullUndefined<TOutput>
  }
  currencyAmounts: BaseDerivedInfo<TInput>['currencyAmounts'] & {
    [CurrencyField.OUTPUT]: NullUndefined<CurrencyAmount<TOutput>>
  }
  currencyBalances: BaseDerivedInfo<TInput>['currencyBalances'] & {
    [CurrencyField.OUTPUT]: NullUndefined<CurrencyAmount<TOutput>>
  }
  formattedAmounts: BaseDerivedInfo<TInput>['formattedAmounts'] & {
    [CurrencyField.OUTPUT]: string
  }
  trade: ReturnType<typeof useTrade>
  wrapType: WrapType
  isUSDInput?: boolean
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
  selectingCurrencyField?: CurrencyField
  txId?: string
}

/** Returns information derived from the current swap state */
export function useDerivedSwapInfo(state: TransactionState): DerivedSwapInfo {
  const {
    [CurrencyField.INPUT]: currencyAssetIn,
    [CurrencyField.OUTPUT]: currencyAssetOut,
    exactAmountUSD,
    exactAmountToken,
    exactCurrencyField,
    isUSDInput,
    selectingCurrencyField,
    txId,
  } = state

  const activeAccount = useActiveAccount()

  const currencyIn = useCurrency(
    currencyAssetIn ? buildCurrencyId(currencyAssetIn.chainId, currencyAssetIn?.address) : undefined
  )

  const currencyOut = useCurrency(
    currencyAssetOut
      ? buildCurrencyId(currencyAssetOut.chainId, currencyAssetOut?.address)
      : undefined
  )

  const currencies = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyIn,
      [CurrencyField.OUTPUT]: currencyOut,
    }
  }, [currencyIn, currencyOut])

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId ?? ChainId.Mainnet

  const { balance: tokenInBalance } = useTokenBalance(
    currencyIn?.isToken ? currencyIn : undefined,
    activeAccount?.address
  )
  const { balance: tokenOutBalance } = useTokenBalance(
    currencyOut?.isToken ? currencyOut : undefined,
    activeAccount?.address
  )

  const { balance: nativeInBalance } = useNativeCurrencyBalance(
    currencyIn?.chainId ?? ChainId.Mainnet,
    activeAccount?.address
  )
  const { balance: nativeOutBalance } = useNativeCurrencyBalance(
    currencyOut?.chainId ?? ChainId.Mainnet,
    activeAccount?.address
  )

  const isExactIn = exactCurrencyField === CurrencyField.INPUT
  const wrapType = getWrapType(currencyIn, currencyOut)

  const otherCurrency = isExactIn ? currencyOut : currencyIn
  const exactCurrency = isExactIn ? currencyIn : currencyOut

  // amountSpecified, otherCurrency, tradeType fully defines a trade
  const amountSpecified = useMemo(() => {
    return tryParseExactAmount(exactAmountToken, exactCurrency)
  }, [exactAmountToken, exactCurrency])

  const shouldGetQuote = !isWrapAction(wrapType)

  const trade = useTrade(
    shouldGetQuote ? amountSpecified : null,
    otherCurrency,
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  )

  const tradeUSDValue = useUSDCValue(isUSDInput ? trade.trade?.outputAmount : undefined)
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

  const getFormattedInput = useCallback(() => {
    if (isExactIn || isWrapAction(wrapType)) {
      return isUSDInput ? exactAmountUSD : exactAmountToken
    }

    return isUSDInput
      ? tradeUSDValue?.toFixed(2)
      : (
          currencyAmounts[CurrencyField.INPUT]?.toSignificant(NUM_CURRENCY_SIG_FIGS) ?? ''
        ).toString()
  }, [
    currencyAmounts,
    exactAmountToken,
    exactAmountUSD,
    isExactIn,
    isUSDInput,
    tradeUSDValue,
    wrapType,
  ])

  const getFormattedOutput = useCallback(() => {
    if (!isExactIn || isWrapAction(wrapType)) {
      return isUSDInput ? exactAmountUSD : exactAmountToken
    }

    return isUSDInput
      ? tradeUSDValue?.toFixed(2)
      : currencyAmounts[CurrencyField.OUTPUT]?.toSignificant(NUM_CURRENCY_SIG_FIGS)
  }, [
    currencyAmounts,
    exactAmountToken,
    exactAmountUSD,
    isExactIn,
    isUSDInput,
    tradeUSDValue,
    wrapType,
  ])

  const currencyBalances = useMemo(() => {
    return {
      [CurrencyField.INPUT]: currencyIn?.isNative ? nativeInBalance : tokenInBalance,
      [CurrencyField.OUTPUT]: currencyOut?.isNative ? nativeOutBalance : tokenOutBalance,
    }
  }, [
    currencyIn?.isNative,
    currencyOut?.isNative,
    nativeInBalance,
    nativeOutBalance,
    tokenInBalance,
    tokenOutBalance,
  ])

  return useMemo(() => {
    return {
      chainId,
      currencies,
      currencyAmounts,
      currencyBalances,
      exactAmountToken,
      exactAmountUSD,
      exactCurrencyField,
      formattedAmounts: {
        [CurrencyField.INPUT]: getFormattedInput() || '',
        [CurrencyField.OUTPUT]: getFormattedOutput() || '',
      },
      trade,
      wrapType,
      isUSDInput,
      nativeCurrencyBalance: nativeInBalance,
      selectingCurrencyField,
      txId,
    }
  }, [
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    exactCurrencyField,
    getFormattedInput,
    getFormattedOutput,
    isUSDInput,
    nativeInBalance,
    selectingCurrencyField,
    trade,
    txId,
    wrapType,
  ])
}

export function useUSDTokenUpdater(
  dispatch: React.Dispatch<AnyAction>,
  isUSDInput: boolean,
  exactAmountToken: string,
  exactAmountUSD: string,
  exactCurrency?: Currency
) {
  const price = useUSDCPrice(exactCurrency)
  const shouldUseUSDRef = useRef(isUSDInput)

  useEffect(() => {
    shouldUseUSDRef.current = isUSDInput
  }, [isUSDInput])

  useEffect(() => {
    if (!exactCurrency || !price) return

    if (shouldUseUSDRef.current) {
      const stablecoinAmount = tryParseExactAmount(
        exactAmountUSD,
        STABLECOIN_AMOUNT_OUT[exactCurrency.chainId].currency
      )
      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined

      return dispatch(
        updateExactAmountToken({
          amount: currencyAmount?.toSignificant(NUM_CURRENCY_SIG_FIGS) || '',
        })
      )
    }

    const exactCurrencyAmount = tryParseExactAmount(exactAmountToken, exactCurrency)
    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    return dispatch(
      updateExactAmountUSD({ amount: usdPrice?.toFixed(NUM_USD_DECIMALS_DISPLAY) || '' })
    )
  }, [dispatch, shouldUseUSDRef, exactAmountUSD, exactAmountToken, exactCurrency, price])
}

/** Set of handlers wrapping actions involving user input */
export function useSwapActionHandlers(dispatch: React.Dispatch<AnyAction>) {
  const onHideTokenSelector = useCallback(
    () => dispatch(transactionStateActions.showTokenSelector(undefined)),
    [dispatch]
  )

  const onSelectCurrency = useCallback(
    (field: CurrencyField, currency: Currency) => {
      dispatch(
        transactionStateActions.selectCurrency({
          field,
          tradeableAsset: {
            address: currencyAddress(currency),
            chainId: currency.chainId,
            type: AssetType.Currency,
          },
        })
      )

      // hide screen when done selecting
      onHideTokenSelector()
    },
    [dispatch, onHideTokenSelector]
  )

  const onUpdateExactTokenAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountToken({ field, amount })),
    [dispatch]
  )

  const onUpdateExactUSDAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountUSD({ field, amount })),
    [dispatch]
  )

  const onUpdateExactCurrencyField = useCallback(
    (currencyField: CurrencyField, newExactAmount: string) =>
      dispatch(transactionStateActions.updateExactCurrencyField({ currencyField, newExactAmount })),
    [dispatch]
  )

  const onSetAmount = useCallback(
    (field: CurrencyField, value: string, isUSDInput: boolean) => {
      const updater = isUSDInput ? onUpdateExactUSDAmount : onUpdateExactTokenAmount
      updater(field, value)
    },
    [onUpdateExactUSDAmount, onUpdateExactTokenAmount]
  )

  const onSetMax = useCallback(
    (amount: string) => {
      // when setting max amount, always switch to token mode because
      // our token/usd updater doesnt handle this case yet
      dispatch(transactionStateActions.toggleUSDInput(false))
      dispatch(
        transactionStateActions.updateExactAmountToken({ field: CurrencyField.INPUT, amount })
      )
    },
    [dispatch]
  )

  const onSwitchCurrencies = useCallback(() => {
    dispatch(transactionStateActions.switchCurrencySides())
  }, [dispatch])

  const onToggleUSDInput = useCallback(
    (isUSDInput: boolean) => dispatch(transactionStateActions.toggleUSDInput(isUSDInput)),
    [dispatch]
  )

  const onCreateTxId = useCallback(
    (txId: string) => dispatch(transactionStateActions.setTxId(txId)),
    [dispatch]
  )

  const onShowTokenSelector = useCallback(
    (field: CurrencyField) => dispatch(transactionStateActions.showTokenSelector(field)),
    [dispatch]
  )

  return {
    onCreateTxId,
    onHideTokenSelector,
    onSelectCurrency,
    onSwitchCurrencies,
    onToggleUSDInput,
    onSetAmount,
    onSetMax,
    onUpdateExactCurrencyField,
    onShowTokenSelector,
  }
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // not enough allowance and token cannot be approved through .permit instead
  Approve = 'approve',

  // not enough allowance but token can be approved through permit signature
  Permit = 'permit',
}

type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit
      txRequest: null
    }
  | {
      action: ApprovalAction.Approve
      txRequest: providers.TransactionRequest
    }

export function useTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo?: TokenApprovalInfo
): providers.TransactionRequest | undefined {
  const wrapTxRequest = useWrapTransactionRequest(derivedSwapInfo)
  const swapTxRequest = useSwapTransactionRequest(derivedSwapInfo, tokenApprovalInfo)
  return derivedSwapInfo.wrapType === WrapType.NotApplicable ? swapTxRequest : wrapTxRequest
}

function useWrapTransactionRequest(derivedSwapInfo: DerivedSwapInfo) {
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
  currencyAmountIn: NullUndefined<CurrencyAmount<Currency>>
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
export function useTokenApprovalInfo(
  chainId: ChainId,
  wrapType: WrapType,
  currencyInAmount: NullUndefined<CurrencyAmount<Currency>>
): TokenApprovalInfo | undefined {
  const address = useActiveAccountAddressWithThrow()
  const provider = useProvider(chainId)
  const contractManager = useContractManager()

  const transactionFetcher = useCallback(() => {
    if (!provider || !currencyInAmount) return

    return getTokenApprovalInfo(provider, contractManager, address, wrapType, currencyInAmount)
  }, [address, contractManager, currencyInAmount, provider, wrapType])

  return useAsyncData(transactionFetcher).data
}

const getTokenApprovalInfo = async (
  provider: providers.Provider,
  contractManager: ContractManager,
  address: Address,
  wrapType: WrapType,
  currencyInAmount: CurrencyAmount<Currency>
): Promise<TokenApprovalInfo | undefined> => {
  const currencyIn = currencyInAmount?.currency
  if (!currencyIn) return undefined

  // wrap/unwraps do not need approval
  if (wrapType !== WrapType.NotApplicable) return { action: ApprovalAction.None, txRequest: null }

  // native tokens do not need approvals
  if (currencyIn.isNative) return { action: ApprovalAction.None, txRequest: null }

  const currencyInAmountRaw = currencyInAmount.quotient.toString()
  const chainId = currencyInAmount.currency.chainId
  const spender = SWAP_ROUTER_ADDRESSES[chainId]
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    currencyIn.address,
    provider,
    ERC20_ABI
  )
  const allowance = await tokenContract.callStatic.allowance(address, spender)
  if (!allowance.lt(currencyInAmountRaw)) {
    return { action: ApprovalAction.None, txRequest: null }
  }

  if (PERMITTABLE_TOKENS[chainId]?.[currencyIn.address]) {
    return { action: ApprovalAction.Permit, txRequest: null }
  }

  let baseTransaction
  try {
    baseTransaction = await tokenContract.populateTransaction.approve(spender, MAX_APPROVE_AMOUNT, {
      from: address,
    })
  } catch {
    // above call errors when token restricts max approvals
    baseTransaction = await tokenContract.populateTransaction.approve(
      spender,
      currencyInAmountRaw,
      {
        from: address,
      }
    )
  }

  return {
    txRequest: { ...baseTransaction, from: address, chainId },
    action: ApprovalAction.Approve,
  }
}

export function useSwapTransactionRequest(
  derivedSwapInfo: DerivedSwapInfo,
  tokenApprovalInfo?: TokenApprovalInfo
): providers.TransactionRequest | undefined {
  const {
    chainId,
    trade: { trade },
    wrapType,
    exactCurrencyField,
    currencies,
    currencyAmounts,
  } = derivedSwapInfo
  const address = useActiveAccountAddressWithThrow()
  const { data: permitInfo, isLoading: permitInfoLoading } = usePermitSignature(
    chainId,
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    tokenApprovalInfo?.action
  )

  const [otherCurrency, tradeType] =
    exactCurrencyField === CurrencyField.INPUT
      ? [currencies[CurrencyField.OUTPUT], TradeType.EXACT_INPUT]
      : [currencies[CurrencyField.INPUT], TradeType.EXACT_OUTPUT]

  // get simulated gasLimit only if token doesn't have enough allowance AND we can't get the allowance
  // through .permit instead
  const shouldFetchSimulatedGasLimit = tokenApprovalInfo?.action === ApprovalAction.Approve

  const { isLoading: simulatedGasLimitLoading, simulatedGasLimit } = useSimulatedGasLimit(
    chainId,
    currencyAmounts[exactCurrencyField],
    otherCurrency,
    tradeType,
    !shouldFetchSimulatedGasLimit
  )

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  return useMemo(() => {
    if (
      wrapType !== WrapType.NotApplicable ||
      !currencyAmountIn ||
      !tokenApprovalInfo ||
      (!simulatedGasLimit && simulatedGasLimitLoading) ||
      permitInfoLoading ||
      !trade
    ) {
      return
    }

    const swapRouterAddress = SWAP_ROUTER_ADDRESSES[chainId]
    const baseSwapTx = {
      from: address,
      to: swapRouterAddress,
      chainId,
    }

    if (permitInfo) {
      const { calldata, value } = SwapRouter.swapCallParameters(trade, {
        slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE_PERCENT,
        recipient: address,
        inputTokenPermit: permitInfo,
      })

      return { ...baseSwapTx, data: calldata, value }
    }

    const methodParameters = trade.quote?.methodParameters
    if (!methodParameters) {
      throw new Error('Trade quote methodParameters were not provided by the router endpoint')
    }

    return {
      ...baseSwapTx,
      data: methodParameters.calldata,
      value: methodParameters.value,

      // if the swap transaction does not require a Tenderly gas limit simulation, submit "undefined" here
      // so that ethers can calculate the gasLimit later using .estimateGas(tx) instead
      gasLimit: shouldFetchSimulatedGasLimit ? simulatedGasLimit : undefined,
    }
  }, [
    address,
    chainId,
    currencyAmountIn,
    permitInfo,
    permitInfoLoading,
    shouldFetchSimulatedGasLimit,
    simulatedGasLimit,
    simulatedGasLimitLoading,
    tokenApprovalInfo,
    trade,
    wrapType,
  ])
}

export function useSwapTxAndGasInfo(derivedSwapInfo: DerivedSwapInfo, skipGasFeeQuery: boolean) {
  const { chainId, wrapType, currencyAmounts } = derivedSwapInfo

  const tokenApprovalInfo = useTokenApprovalInfo(
    chainId,
    wrapType,
    currencyAmounts[CurrencyField.INPUT]
  )
  const txRequest = useTransactionRequest(derivedSwapInfo, tokenApprovalInfo)

  const approveFeeInfo = useTransactionGasFee(
    tokenApprovalInfo?.txRequest,
    GasSpeed.Urgent,
    skipGasFeeQuery
  )
  const txFeeInfo = useTransactionGasFee(txRequest, GasSpeed.Urgent, skipGasFeeQuery)
  const totalGasFee = sumGasFees(approveFeeInfo?.gasFee, txFeeInfo?.gasFee)

  const txWithGasSettings = useMemo(() => {
    if (!txRequest || !txFeeInfo) return

    return { ...txRequest, ...txFeeInfo.params }
  }, [txRequest, txFeeInfo])

  const approveLoading =
    !tokenApprovalInfo || Boolean(tokenApprovalInfo.txRequest && !approveFeeInfo)

  const approveTxWithGasSettings = useMemo(() => {
    if (approveLoading || !tokenApprovalInfo?.txRequest) return

    return { ...tokenApprovalInfo.txRequest, ...approveFeeInfo?.params }
  }, [approveLoading, tokenApprovalInfo?.txRequest, approveFeeInfo?.params])

  return {
    txRequest: txWithGasSettings,
    approveTxRequest: approveTxWithGasSettings,
    totalGasFee,
    isLoading: approveLoading,
  }
}

/** Callback to submit trades and track progress */
export function useSwapCallback(
  approveTxRequest: providers.TransactionRequest | undefined,
  swapTxRequest: providers.TransactionRequest | undefined,
  trade: Trade | null | undefined,
  onSubmit?: () => void,
  txId?: string
): () => void {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  return useMemo(() => {
    if (!account || !swapTxRequest || !trade) {
      return () => {
        logger.error('hooks', 'useSwapCallback', 'Missing swapTx')
      }
    }

    return () => {
      appDispatch(
        swapActions.trigger({
          txId,
          account,
          trade,
          approveTxRequest,
          swapTxRequest,
        })
      )
      onSubmit?.()
    }
  }, [account, swapTxRequest, appDispatch, txId, trade, approveTxRequest, onSubmit])
}

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType,
  onSuccess: () => void,
  txRequest?: providers.TransactionRequest,
  txId?: string
) {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()
  const wrapState = useSagaStatus(tokenWrapSagaName, onSuccess)

  useEffect(() => {
    if (wrapState.status === SagaStatus.Started) {
      onSuccess()
    }
  })

  return useMemo(() => {
    if (!isWrapAction(wrapType)) {
      return {
        wrapCallback: () =>
          logger.error('hooks', 'useWrapCallback', 'Wrap callback invoked for non-wrap actions'),
      }
    }

    if (!account || !inputCurrencyAmount || !txRequest) {
      return {
        wrapCallback: () =>
          logger.error(
            'hooks',
            'useWrapCallback',
            'Wrap callback invoked without active account, input currency or valid transaction request'
          ),
      }
    }

    return {
      wrapCallback: () => {
        appDispatch(
          tokenWrapActions.trigger({
            account,
            inputCurrencyAmount,
            txId,
            txRequest,
          })
        )
      },
    }
  }, [txId, account, appDispatch, inputCurrencyAmount, wrapType, txRequest])
}

// The first trade shown to the user is implicitly accepted but every subsequent update to
// the trade params require an explicit user approval
export function useAcceptedTrade(trade: NullUndefined<Trade>) {
  const [latestTradeAccepted, setLatestTradeAccepted] = useState<boolean>(false)
  const prevTradeRef = useRef<Trade>()
  useEffect(() => {
    if (latestTradeAccepted) setLatestTradeAccepted(false)
    if (!prevTradeRef.current) prevTradeRef.current = trade ?? undefined
  }, [latestTradeAccepted, trade])

  const acceptedTrade = prevTradeRef.current ?? trade ?? undefined

  const onAcceptTrade = () => {
    if (!trade) return undefined
    setLatestTradeAccepted(true)
    prevTradeRef.current = trade
  }

  return { onAcceptTrade, acceptedTrade }
}

export function useShowSwapNetworkNotification(chainId?: ChainId) {
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
