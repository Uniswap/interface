import type { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { type ClassicQuoteResponse, type DiscriminatedQuoteResponse, TradingApi } from '@universe/api'
import { DynamicConfigs, getDynamicConfigValue, SwapConfigKey } from '@universe/gating'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { createEarnChainedActionDisplayAmounts } from 'uniswap/src/features/earn/chainedDisplayAmounts'
import {
  createBridgeTrade,
  createChainedActionTrade,
  createClassicTrade,
  createPriorityOrderTrade,
  createUniswapXV2Trade,
  createUniswapXV3Trade,
  createUnwrapTrade,
  createWrapTrade,
  type Trade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { DEFAULT_PROTOCOL_OPTIONS, useProtocols } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export const NATIVE_ADDRESS_FOR_TRADING_API = '0x0000000000000000000000000000000000000000'

/** Default urgency for all swap-related TAPI requests (quote, swap, approval). */
export const DEFAULT_URGENCY_LEVEL = TradingApi.UrgencyWithOverrides.level.URGENT

/** Builds the TAPI `urgency` wire field: object form when caller overrides are
 *  present, bare level string otherwise. */
export function buildUrgency(overrides: TradingApi.UrgencyOverrides | undefined): TradingApi.Urgency {
  return overrides ? { level: DEFAULT_URGENCY_LEVEL, overrides } : DEFAULT_URGENCY_LEVEL
}

interface TradingApiResponseToTradeArgs {
  currencyIn: Currency
  currencyOut: Currency
  tradeType: TradeType
  deadline: number | undefined
  data: DiscriminatedQuoteResponse | undefined
  earnIntent?: TradingApi.EarnIntent
}

export function transformTradingApiResponseToTrade(params: TradingApiResponseToTradeArgs): Trade | null {
  const { currencyIn, currencyOut, tradeType, deadline, data, earnIntent } = params

  switch (data?.routing) {
    case TradingApi.Routing.CLASSIC: {
      if (!deadline) {
        return null
      }

      return createClassicTrade({
        quote: data,
        currencyIn,
        currencyOut,
        deadline,
        tradeType,
      })
    }
    case TradingApi.Routing.PRIORITY:
    case TradingApi.Routing.DUTCH_V3:
    case TradingApi.Routing.DUTCH_V2: {
      const { quote } = data
      // UniswapX backend response does not include decimals; local currencies must be passed to UniswapXTrade rather than tokens parsed from the api response.
      // We validate the token addresses match to ensure the trade is valid.
      if (
        !areAddressesEqual({
          addressInput1: { address: getTokenAddressForApi(currencyIn), chainId: currencyIn.chainId },
          addressInput2: { address: quote.orderInfo.input.token, chainId: currencyIn.chainId },
        }) ||
        !areAddressesEqual({
          addressInput1: { address: getTokenAddressForApi(currencyOut), chainId: currencyOut.chainId },
          addressInput2: { address: quote.orderInfo.outputs[0]?.token, chainId: currencyOut.chainId },
        })
      ) {
        return null
      }

      const isPriority = data.routing === TradingApi.Routing.PRIORITY
      if (isPriority) {
        return createPriorityOrderTrade({ quote: data, currencyIn, currencyOut, tradeType })
      } else if (data.routing === TradingApi.Routing.DUTCH_V2) {
        return createUniswapXV2Trade({ quote: data, currencyIn, currencyOut, tradeType })
      } else {
        return createUniswapXV3Trade({ quote: data, currencyIn, currencyOut, tradeType })
      }
    }
    case TradingApi.Routing.BRIDGE: {
      return createBridgeTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.WRAP: {
      return createWrapTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.UNWRAP: {
      return createUnwrapTrade({ quote: data, currencyIn, currencyOut, tradeType })
    }
    case TradingApi.Routing.CHAINED: {
      const resolvedEarnIntent = earnIntent ?? data.quote.earnIntent
      const earnDisplayAmounts = resolvedEarnIntent
        ? createEarnChainedActionDisplayAmounts({
            quote: data,
            currencyIn,
            currencyOut,
            earnIntent: resolvedEarnIntent,
          })
        : undefined

      if (resolvedEarnIntent && !earnDisplayAmounts) {
        return null
      }

      return createChainedActionTrade({
        quote: data,
        currencyIn,
        currencyOut,
        earnIntent: resolvedEarnIntent,
        displayAmountsOverride: earnDisplayAmounts ?? undefined,
      })
    }
    default: {
      return null
    }
  }
}

export function getTokenAddressFromChainForTradingApi(address: Address, chainId: UniverseChainId): string {
  // For native currencies, we need to map to 0x0000000000000000000000000000000000000000
  if (address === getChainInfo(chainId).nativeCurrency.address) {
    return NATIVE_ADDRESS_FOR_TRADING_API
  }
  return address
}

export function getTokenAddressForApi(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }
  return currency.isNative ? NATIVE_ADDRESS_FOR_TRADING_API : currency.address
}

const SUPPORTED_TRADING_API_CHAIN_IDS: number[] = Object.values(TradingApi.ChainId).filter(
  (value): value is number => typeof value === 'number',
)

// Parse any chain id to check if its supported by the API ChainId type
function isTradingApiSupportedChainId(chainId?: number): chainId is TradingApi.ChainId {
  if (!chainId) {
    return false
  }
  return Object.values(SUPPORTED_TRADING_API_CHAIN_IDS).includes(chainId)
}

export function toTradingApiSupportedChainId(chainId: Maybe<number>): TradingApi.ChainId | undefined {
  if (!chainId || !isTradingApiSupportedChainId(chainId)) {
    return undefined
  }
  return chainId
}

export function getClassicQuoteFromResponse(
  quote?: ClassicQuoteResponse | { routing: Exclude<TradingApi.Routing, TradingApi.Routing.CLASSIC> },
): TradingApi.ClassicQuote | undefined {
  if (quote && isClassic(quote)) {
    return quote.quote
  }
  return undefined
}

/**
 * The trade object should always have the same currencies and amounts as the form values
 * from state - to avoid bad swap submissions we should invalidate the trade object if there are mismatches.
 */
export function validateTrade({
  trade,
  currencyIn,
  currencyOut,
  exactAmount,
  exactCurrencyField,
}: {
  trade: Trade | null
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  exactAmount: Maybe<CurrencyAmount<Currency>>
  exactCurrencyField: CurrencyField
}): Trade | null {
  // skip if no valid trade object
  if (!trade || !currencyIn || !currencyOut || !exactAmount) {
    return null
  }

  const inputsMatch = areAddressesEqual({
    addressInput1: { address: currencyIn.wrapped.address, chainId: currencyIn.chainId },
    addressInput2: { address: trade.inputAmount.currency.wrapped.address, chainId: trade.inputAmount.currency.chainId },
  })
  const outputsMatch = areAddressesEqual({
    addressInput1: { address: currencyOut.wrapped.address, chainId: currencyOut.chainId },
    addressInput2: {
      address: trade.outputAmount.currency.wrapped.address,
      chainId: trade.outputAmount.currency.chainId,
    },
  })

  const isEarnDeposit = isEarnDepositTrade(trade)
  const outputsAreValid = isEarnDeposit ? hasValidEarnDepositOutput(trade) : outputsMatch
  const tokenAddressesMatch = inputsMatch && outputsAreValid
  // TODO(WEB-5132): Add validation checking that exact amount from response matches exact amount from user input
  if (!tokenAddressesMatch) {
    logger.error(new Error(`Mismatched address in swap trade`), {
      tags: { file: 'tradingApi/utils', function: 'validateTrade' },
      extra: {
        formState: {
          currencyIdIn: currencyId(currencyIn),
          currencyIdOut: currencyId(currencyOut),
          exactAmount: exactAmount.toExact(),
          exactCurrencyField,
        },
        tradeProperties: trade,
      },
    })

    return null
  }

  return trade
}

function hasValidEarnDepositOutput(trade: Trade): boolean {
  if (!isEarnDepositTrade(trade)) {
    return false
  }

  const earnIntent = trade.earnIntent
  const outputToken = trade.quote.quote.output.token

  if (trade.quote.quote.earnPreview?.type !== 'DEPOSIT' || !outputToken) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address: outputToken, chainId: Number(trade.quote.quote.tokenOutChainId) },
    addressInput2: { address: earnIntent.vault, chainId: Number(earnIntent.chainId) },
  })
}

function isEarnDepositTrade(trade: Trade): trade is Trade & {
  routing: TradingApi.Routing.CHAINED
  earnIntent: NonNullable<Extract<Trade, { routing: TradingApi.Routing.CHAINED }>['earnIntent']>
} {
  return trade.routing === TradingApi.Routing.CHAINED && trade.earnIntent?.action === TradingApi.EarnAction.DEPOSIT
}

type UseQuoteRoutingParamsArgs = {
  selectedProtocols: FrontendSupportedProtocol[] | undefined
  tokenInChainId: UniverseChainId | undefined
  tokenOutChainId: UniverseChainId | undefined
  isUSDQuote?: boolean
  isV4HookPoolsEnabled?: boolean
}

export type QuoteRoutingParamsResult = Pick<TradingApi.QuoteRequest, 'routingPreference' | 'protocols' | 'hooksOptions'>

export function useQuoteRoutingParams({
  selectedProtocols,
  isUSDQuote,
  isV4HookPoolsEnabled = true,
}: UseQuoteRoutingParamsArgs): QuoteRoutingParamsResult {
  const protocols = useProtocols(selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS)

  const getQuoteRoutingParams = createGetQuoteRoutingParams({
    getProtocols: () => protocols,
    getIsV4HookPoolsEnabled: () => isV4HookPoolsEnabled,
  })

  return getQuoteRoutingParams({ isUSDQuote })
}

export type GetQuoteRoutingParams = (input: Pick<UseQuoteRoutingParamsArgs, 'isUSDQuote'>) => QuoteRoutingParamsResult

export function createGetQuoteRoutingParams(ctx: {
  getProtocols: () => TradingApi.ProtocolItems[]
  getIsV4HookPoolsEnabled: () => boolean
}): GetQuoteRoutingParams {
  return (input) => {
    const { isUSDQuote } = input
    // for USD quotes, we avoid routing through UniswapX
    // hooksOptions should not be sent for USD quotes
    if (isUSDQuote) {
      return {
        protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
      }
    }

    const protocols = ctx.getProtocols()

    let finalProtocols = [...protocols]
    let hooksOptions: TradingApi.HooksOptions

    const isV4HookPoolsEnabled = ctx.getIsV4HookPoolsEnabled()

    if (isV4HookPoolsEnabled) {
      if (!protocols.includes(TradingApi.ProtocolItems.V4)) {
        finalProtocols = [...protocols, TradingApi.ProtocolItems.V4] // we need to re-add v4 to protocols if v4 hooks is toggled on
        hooksOptions = TradingApi.HooksOptions.V4_HOOKS_ONLY
      } else {
        hooksOptions = TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE
      }
    } else {
      hooksOptions = TradingApi.HooksOptions.V4_NO_HOOKS
    }

    return { protocols: finalProtocols, hooksOptions }
  }
}

// Used if dynamic config value fails to resolve
const DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE = 2.5

export function getMinAutoSlippageToleranceL2(): number {
  return getDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.MinAutoSlippageToleranceL2,
    defaultValue: DEFAULT_L2_SLIPPAGE_TOLERANCE_VALUE,
  })
}

type GetQuoteSlippageParamsArgs = {
  tokenInChainId: UniverseChainId | undefined
  tokenOutChainId: UniverseChainId | undefined
  isUSDQuote?: boolean
}

export type QuoteSlippageParamsResult = Pick<TradingApi.QuoteRequest, 'autoSlippage' | 'slippageTolerance'> | undefined

export type GetQuoteSlippageParams = (input: GetQuoteSlippageParamsArgs) => QuoteSlippageParamsResult

export function createGetQuoteSlippageParams(ctx: {
  getMinAutoSlippageToleranceL2: () => number
  getIsL2ChainId: (chainId?: UniverseChainId) => boolean
  getCustomSlippageTolerance: () => number | undefined
}): GetQuoteSlippageParams {
  return function getQuoteSlippageParams(input: GetQuoteSlippageParamsArgs): QuoteSlippageParamsResult {
    const { tokenInChainId, tokenOutChainId, isUSDQuote } = input
    const customSlippageTolerance = ctx.getCustomSlippageTolerance()
    if (customSlippageTolerance) {
      return { slippageTolerance: customSlippageTolerance }
    }

    // For cross-chain swaps, use default as it will be handled by the backend
    if (tokenInChainId !== tokenOutChainId || isUSDQuote) {
      return { autoSlippage: TradingApi.AutoSlippage.DEFAULT }
    }

    // L2 chains should use the minimum slippage tolerance defined in the dynamic config
    if (ctx.getIsL2ChainId(tokenInChainId)) {
      return { slippageTolerance: ctx.getMinAutoSlippageToleranceL2() }
    }

    // Otherwise, use an auto slippage tolerance calculated on the backend
    return { autoSlippage: TradingApi.AutoSlippage.DEFAULT }
  }
}

export function tradingApiToUniverseChainId(chainId?: TradingApi.ChainId): UniverseChainId | undefined {
  if (!chainId) {
    return undefined
  }

  const castedChainId = Number(chainId)
  return isUniverseChainId(castedChainId) ? castedChainId : undefined
}
