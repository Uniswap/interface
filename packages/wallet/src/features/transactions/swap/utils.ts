import { Protocol } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import {
  FlatFeeOptions,
  SwapOptions as UniversalRouterSwapOptions,
  SwapRouter as UniversalSwapRouter,
} from '@uniswap/universal-router-sdk'
import { FeeOptions } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers'
import { AppTFunction } from 'ui/src/i18n/types'
import { NumberType } from 'utilities/src/format/types'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
  WrapType,
} from 'wallet/src/features/transactions/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { ElementName, ElementNameType } from 'wallet/src/telemetry/constants'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import {
  areCurrencyIdsEqual,
  buildWrappedNativeCurrencyId,
  CurrencyId,
  currencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'wallet/src/utils/currencyId'

export function serializeQueryParams(
  params: Record<string, Parameters<typeof encodeURIComponent>[0]>
): string {
  const queryString = []
  for (const [param, value] of Object.entries(params)) {
    queryString.push(`${encodeURIComponent(param)}=${encodeURIComponent(value)}`)
  }
  return queryString.join('&')
}

export const clearStaleTrades = (
  trade: Trade,
  currencyIn: Maybe<Currency>,
  currencyOut: Maybe<Currency>
): Trade | null => {
  const currencyInAddress = currencyIn?.wrapped.address
  const currencyOutAddress = currencyOut?.wrapped.address

  const inputsMatch =
    !!currencyInAddress &&
    areAddressesEqual(currencyInAddress, trade?.inputAmount.currency.wrapped.address)
  const outputsMatch =
    !!currencyOutAddress &&
    areAddressesEqual(currencyOutAddress, trade?.outputAmount.currency.wrapped.address)

  // if the addresses entered by the user don't match what is being returned by the quote endpoint
  // then set `trade` to null
  return inputsMatch && outputsMatch ? trade : null
}

export function getWrapType(
  inputCurrency: Currency | null | undefined,
  outputCurrency: Currency | null | undefined
): WrapType {
  if (!inputCurrency || !outputCurrency || inputCurrency.chainId !== outputCurrency.chainId) {
    return WrapType.NotApplicable
  }

  const inputChainId = inputCurrency.chainId as ChainId
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(inputChainId)

  if (
    inputCurrency.isNative &&
    areCurrencyIdsEqual(currencyId(outputCurrency), wrappedCurrencyId)
  ) {
    return WrapType.Wrap
  } else if (
    outputCurrency.isNative &&
    areCurrencyIdsEqual(currencyId(inputCurrency), wrappedCurrencyId)
  ) {
    return WrapType.Unwrap
  }

  return WrapType.NotApplicable
}

export function isWrapAction(wrapType: WrapType): wrapType is WrapType.Unwrap | WrapType.Wrap {
  return wrapType === WrapType.Unwrap || wrapType === WrapType.Wrap
}

export function tradeToTransactionInfo(
  trade: Trade
): ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo {
  const slippageTolerancePercent = slippageToleranceToPercent(trade.slippageTolerance)
  const { quoteData, slippageTolerance } = trade

  // TODO: add additional fields when trading api adds them
  // https://linear.app/uniswap/issue/MOB-2453/add-additional-properties-to-trading-api
  const routingApiQuote =
    quoteData?.quoteType === QuoteType.RoutingApi ? quoteData.quote : undefined

  const { quoteId, gasUseEstimate, routeString } = routingApiQuote || {}

  const baseTransactionInfo = {
    inputCurrencyId: currencyId(trade.inputAmount.currency),
    outputCurrencyId: currencyId(trade.outputAmount.currency),
    slippageTolerance,
    quoteId,
    gasUseEstimate,
    routeString,
    protocol: getProtocolVersionFromTrade(trade),
  }

  return trade.tradeType === TradeType.EXACT_INPUT
    ? {
        ...baseTransactionInfo,
        type: TransactionType.Swap,
        tradeType: TradeType.EXACT_INPUT,
        inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        minimumOutputCurrencyAmountRaw: trade
          .minimumAmountOut(slippageTolerancePercent)
          .quotient.toString(),
      }
    : {
        ...baseTransactionInfo,
        type: TransactionType.Swap,
        tradeType: TradeType.EXACT_OUTPUT,
        outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
        expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
        maximumInputCurrencyAmountRaw: trade
          .maximumAmountIn(slippageTolerancePercent)
          .quotient.toString(),
      }
}

// any price movement below ACCEPT_NEW_TRADE_THRESHOLD is auto-accepted for the user
const ACCEPT_NEW_TRADE_THRESHOLD = new Percent(1, 100)
export function requireAcceptNewTrade(oldTrade: Maybe<Trade>, newTrade: Maybe<Trade>): boolean {
  if (!oldTrade || !newTrade) {
    return false
  }

  return (
    oldTrade.tradeType !== newTrade.tradeType ||
    !oldTrade.inputAmount.currency.equals(newTrade.inputAmount.currency) ||
    !oldTrade.outputAmount.currency.equals(newTrade.outputAmount.currency) ||
    newTrade.executionPrice.lessThan(oldTrade.worstExecutionPrice(ACCEPT_NEW_TRADE_THRESHOLD))
  )
}

export const getRateToDisplay = (
  formatter: LocalizationContextState,
  trade: Trade,
  showInverseRate: boolean
): string => {
  const price = showInverseRate ? trade.executionPrice.invert() : trade.executionPrice
  const formattedPrice = formatter.formatNumberOrString({
    value: price.toSignificant(),
    type: NumberType.SwapPrice,
  })
  const quoteCurrencySymbol = getSymbolDisplayText(trade.executionPrice.quoteCurrency.symbol)
  const baseCurrencySymbol = getSymbolDisplayText(trade.executionPrice.baseCurrency.symbol)
  const rate = `1 ${quoteCurrencySymbol} = ${formattedPrice} ${baseCurrencySymbol}`
  const inverseRate = `1 ${baseCurrencySymbol} = ${formattedPrice} ${quoteCurrencySymbol}`
  return showInverseRate ? rate : inverseRate
}

export const getActionName = (t: AppTFunction, wrapType: WrapType): string => {
  switch (wrapType) {
    case WrapType.Unwrap:
      return t('Unwrap')
    case WrapType.Wrap:
      return t('Wrap')
    default:
      return t('Swap')
  }
}

export const getActionElementName = (wrapType: WrapType): ElementNameType => {
  switch (wrapType) {
    case WrapType.Unwrap:
      return ElementName.Unwrap
    case WrapType.Wrap:
      return ElementName.Wrap
    default:
      return ElementName.Swap
  }
}

export function sumGasFees(gasFee1?: string | undefined, gasFee2?: string): string | undefined {
  if (!gasFee1 || !gasFee2) {
    return gasFee1 || gasFee2
  }

  return BigNumber.from(gasFee1).add(gasFee2).toString()
}

export const prepareSwapFormState = ({
  inputCurrencyId,
}: {
  inputCurrencyId?: CurrencyId
}): TransactionState | undefined => {
  return inputCurrencyId
    ? {
        exactCurrencyField: CurrencyField.INPUT,
        exactAmountToken: '',
        [CurrencyField.INPUT]: {
          address: currencyIdToAddress(inputCurrencyId),
          chainId: currencyIdToChain(inputCurrencyId) ?? ChainId.Mainnet,
          type: AssetType.Currency,
        },
        [CurrencyField.OUTPUT]: null,
      }
    : undefined
}

// rounds to nearest basis point
export const slippageToleranceToPercent = (slippage: number): Percent => {
  const basisPoints = Math.round(slippage * 100)
  return new Percent(basisPoints, 10_000)
}

interface MethodParameterArgs {
  permit2Signature?: PermitSignatureInfo
  trade: Trade
  address: string
  feeOptions?: FeeOptions
  flatFeeOptions?: FlatFeeOptions
}

export const getSwapMethodParameters = ({
  permit2Signature,
  trade,
  address,
  feeOptions,
  flatFeeOptions,
}: MethodParameterArgs): { calldata: string; value: string } => {
  const slippageTolerancePercent = slippageToleranceToPercent(trade.slippageTolerance)
  const baseOptions = {
    slippageTolerance: slippageTolerancePercent,
    recipient: address,
    fee: feeOptions,
    flatFee: flatFeeOptions,
  }

  const universalRouterSwapOptions: UniversalRouterSwapOptions = permit2Signature
    ? {
        ...baseOptions,
        inputTokenPermit: {
          signature: permit2Signature.signature,
          ...permit2Signature.permitMessage,
        },
      }
    : baseOptions
  return UniversalSwapRouter.swapERC20CallParameters(trade, universalRouterSwapOptions)
}

export function getProtocolVersionFromTrade(trade: Trade): Protocol {
  if (trade.routes.every((r) => r.protocol === Protocol.V2)) {
    return Protocol.V2
  }
  if (trade.routes.every((r) => r.protocol === Protocol.V3)) {
    return Protocol.V3
  }
  return Protocol.MIXED
}
