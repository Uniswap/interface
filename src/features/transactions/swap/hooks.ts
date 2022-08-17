import { Currency, CurrencyAmount, NativeCurrency, Percent, TradeType } from '@uniswap/sdk-core'
import { MethodParameters } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnyAction } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { WarningModalType } from 'src/components/warnings/types'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { estimateGasAction } from 'src/features/gas/estimateGasSaga'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
  useUSDCValue,
} from 'src/features/routing/useUSDCPrice'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { swapActions, swapSagaName } from 'src/features/transactions/swap/swapSaga'
import { Trade, useTrade } from 'src/features/transactions/swap/useTrade'
import { getWrapType, isWrapAction } from 'src/features/transactions/swap/utils'
import { getSwapWarnings } from 'src/features/transactions/swap/validate'
import {
  tokenWrapActions,
  tokenWrapSagaName,
  WrapType,
} from 'src/features/transactions/swap/wrapSaga'
import {
  clearGasSwapData,
  CurrencyField,
  GasFeeByTransactionType,
  OptimismL1FeeEstimate,
  TransactionState,
  transactionStateActions,
  updateExactAmountToken,
  updateExactAmountUSD,
} from 'src/features/transactions/transactionState/transactionState'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { TransactionType } from 'src/features/transactions/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { buildCurrencyId, currencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { SagaState, SagaStatus } from 'src/utils/saga'
import { tryParseExactAmount } from 'src/utils/tryParseAmount'
import { useSagaStatus } from 'src/utils/useSagaStatus'

export const DEFAULT_SLIPPAGE_TOLERANCE_PERCENT = new Percent(DEFAULT_SLIPPAGE_TOLERANCE, 100)
const NUM_CURRENCY_SIG_FIGS = 6
const NUM_USD_DECIMALS_DISPLAY = 2

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

export type DerivedSwapInfo<
  TInput = Currency,
  TOutput extends Currency = Currency
> = BaseDerivedInfo<TInput> & {
  chainId?: ChainId
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
  gasFeeEstimate?: GasFeeByTransactionType
  optimismL1Fee?: OptimismL1FeeEstimate
  exactApproveRequired?: boolean
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
  selectingCurrencyField?: CurrencyField
  swapMethodParameters?: MethodParameters
  txId?: string
  warningModalType?: WarningModalType
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
    gasFeeEstimate,
    optimismL1Fee,
    exactApproveRequired,
    selectingCurrencyField,
    swapMethodParameters,
    warningModalType,
    txId,
  } = state

  const activeAccount = useActiveAccount()
  const { t } = useTranslation()

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

  const chainId = currencyIn?.chainId ?? currencyOut?.chainId

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

  const gasFee = useSwapGasFee(state.gasFeeEstimate, GasSpeed.Urgent)

  const warnings = getSwapWarnings(t, {
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    currencies,
    trade,
    gasFee,
    nativeCurrencyBalance: nativeInBalance,
  })

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
      gasFeeEstimate,
      optimismL1Fee,
      exactApproveRequired,
      nativeCurrencyBalance: nativeInBalance,
      selectingCurrencyField,
      swapMethodParameters,
      txId,
      warnings,
      warningModalType,
    }
  }, [
    chainId,
    currencies,
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    exactCurrencyField,
    exactApproveRequired,
    gasFeeEstimate,
    optimismL1Fee,
    getFormattedInput,
    getFormattedOutput,
    isUSDInput,
    nativeInBalance,
    selectingCurrencyField,
    swapMethodParameters,
    trade,
    txId,
    warnings,
    warningModalType,
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
  const price = useUSDCPrice(exactCurrency ?? undefined)
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
  const onSelectCurrency = (field: CurrencyField, currency: Currency) => {
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
  }

  const onHideTokenSelector = () => dispatch(transactionStateActions.showTokenSelector(undefined))
  const onUpdateExactTokenAmount = (field: CurrencyField, amount: string) =>
    dispatch(transactionStateActions.updateExactAmountToken({ field, amount }))
  const onUpdateExactUSDAmount = (field: CurrencyField, amount: string) =>
    dispatch(transactionStateActions.updateExactAmountUSD({ field, amount }))
  const onUpdateExactCurrencyField = (currencyField: CurrencyField, newExactAmount: string) =>
    dispatch(transactionStateActions.updateExactCurrencyField({ currencyField, newExactAmount }))
  const onSetAmount = (field: CurrencyField, value: string, isUSDInput: boolean) => {
    const updater = isUSDInput ? onUpdateExactUSDAmount : onUpdateExactTokenAmount
    updater(field, value)
  }
  const onSetMax = (amount: string) => {
    // when setting max amount, always switch to token mode because
    // our token/usd updater doesnt handle this case yet
    dispatch(transactionStateActions.toggleUSDInput(false))
    dispatch(transactionStateActions.updateExactAmountToken({ field: CurrencyField.INPUT, amount }))
  }

  const onSwitchCurrencies = () => {
    dispatch(transactionStateActions.switchCurrencySides())
    dispatch(clearGasSwapData)
  }
  const onSelectRecipient = (recipient: Address) =>
    dispatch(transactionStateActions.selectRecipient({ recipient }))
  const onToggleUSDInput = (isUSDInput: boolean) =>
    dispatch(transactionStateActions.toggleUSDInput(isUSDInput))
  const onShowSwapWarning = (type: WarningModalType) =>
    dispatch(transactionStateActions.showWarningModal(type))
  const onCreateTxId = (txId: string) => dispatch(transactionStateActions.setTxId(txId))
  const onShowTokenSelector = (field: CurrencyField) =>
    dispatch(transactionStateActions.showTokenSelector(field))

  return {
    onCreateTxId,
    onHideTokenSelector,
    onSelectCurrency,
    onSelectRecipient,
    onSwitchCurrencies,
    onToggleUSDInput,
    onSetAmount,
    onSetMax,
    onShowSwapWarning,
    onUpdateExactCurrencyField,
    onShowTokenSelector,
  }
}

export function useSwapCallbackFromDerivedSwapInfo(derivedSwapInfo: DerivedSwapInfo) {
  const {
    trade: { trade: trade },
    gasFeeEstimate,
    exactApproveRequired,
    swapMethodParameters,
  } = derivedSwapInfo
  return useSwapCallback(trade, gasFeeEstimate, exactApproveRequired, swapMethodParameters)
}

/** Callback to submit trades and track progress */
export function useSwapCallback(
  trade: Trade | undefined | null,
  gasFeeEstimate: GasFeeByTransactionType | undefined,
  exactApproveRequired: boolean | undefined,
  swapMethodParameters: MethodParameters | undefined,
  onSubmit?: () => void,
  txId?: string
): {
  swapState: SagaState | null
  swapCallback: () => void
} {
  const appDispatch = useAppDispatch()
  const account = useActiveAccount()

  const swapState = useSagaStatus(swapSagaName, onSubmit, true)

  useEffect(() => {
    if (swapState.status === SagaStatus.Started) {
      onSubmit?.()
    }
  }, [onSubmit, swapState])

  return useMemo(() => {
    if (
      !account ||
      !trade ||
      exactApproveRequired === undefined ||
      gasFeeEstimate?.approve === undefined ||
      !gasFeeEstimate?.swap ||
      !swapMethodParameters
    ) {
      return {
        swapCallback: () => {
          logger.error('hooks', 'useSwapCallback', 'Missing swapCallback parameters')
        },
        swapState: null,
      }
    }

    return {
      swapCallback: async () => {
        appDispatch(
          swapActions.trigger({
            txId,
            account,
            trade,
            exactApproveRequired,
            methodParameters: swapMethodParameters,
            gasFeeEstimate,
          })
        )
      },
      swapState,
    }
  }, [
    txId,
    account,
    swapState,
    appDispatch,
    trade,
    gasFeeEstimate,
    exactApproveRequired,
    swapMethodParameters,
  ])
}

export function useWrapCallback(
  inputCurrencyAmount: CurrencyAmount<Currency> | null | undefined,
  wrapType: WrapType,
  onSuccess: () => void,
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

    if (!account || !inputCurrencyAmount) {
      return {
        wrapCallback: () =>
          logger.error(
            'hooks',
            'useWrapCallback',
            'Wrap callback invoked without active account, input currency or weth contract'
          ),
      }
    }

    return {
      wrapCallback: () => {
        appDispatch(
          tokenWrapActions.trigger({
            txId,
            account,
            inputCurrencyAmount,
          })
        )
      },
    }
  }, [txId, account, appDispatch, inputCurrencyAmount, wrapType])
}

export function useUpdateSwapGasEstimate(
  transactionStateDispatch: React.Dispatch<AnyAction>,
  trade: Trade | null
) {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!trade) return
    dispatch(estimateGasAction({ txType: TransactionType.Swap, trade, transactionStateDispatch }))
  }, [trade, transactionStateDispatch, dispatch])
}

export function useSwapGasFee(
  gasFeeEstimate: GasFeeByTransactionType | undefined,
  gasSpeedPreference: GasSpeed,
  optimismL1Fee?: OptimismL1FeeEstimate
) {
  const approveGasFeeInfo = gasFeeEstimate?.[TransactionType.Approve]
  const approveGasFee =
    approveGasFeeInfo === null ? '0' : approveGasFeeInfo?.fee[gasSpeedPreference]
  const swapGasFee = gasFeeEstimate?.[TransactionType.Swap]?.fee[gasSpeedPreference]

  const optimismL1ApproveFee = optimismL1Fee?.[TransactionType.Approve]
  const optimismL1SwapFee = optimismL1Fee?.[TransactionType.Swap]
  return useMemo(() => {
    if (!approveGasFee || !swapGasFee) return undefined

    let gasFee = BigNumber.from(approveGasFee).add(swapGasFee)

    if (optimismL1ApproveFee) {
      gasFee = gasFee.add(optimismL1ApproveFee)
    }

    if (optimismL1SwapFee) {
      gasFee = gasFee.add(optimismL1SwapFee)
    }

    return gasFee.toString()
  }, [approveGasFee, swapGasFee, optimismL1ApproveFee, optimismL1SwapFee])
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
