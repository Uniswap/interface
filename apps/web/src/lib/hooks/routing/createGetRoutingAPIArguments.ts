import { SkipToken } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { GetQuoteArgs, INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, URAQuoteType } from 'state/routing/types'
import { currencyAddressForSwapQuote } from 'state/routing/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface RoutingAPIContext {
  canUseUniswapX: boolean
  isPriorityOrdersEnabled: boolean
  isDutchV3Enabled: boolean
}

export interface RoutingAPIInput {
  account?: string
  tokenIn?: Currency
  tokenOut?: Currency
  amount?: CurrencyAmount<Currency>
  tradeType: TradeType
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  protocolPreferences?: Protocol[]
}

interface RoutingAPIInputValidated {
  account: string
  tokenIn: Currency
  tokenOut: Currency
  amount: CurrencyAmount<Currency>
  tradeType: TradeType
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  protocolPreferences?: Protocol[]
}

export function createGetRoutingAPIArguments(ctx: RoutingAPIContext) {
  const { canUseUniswapX, isPriorityOrdersEnabled, isDutchV3Enabled } = ctx

  return function getRoutingAPIArguments(input: RoutingAPIInput): GetQuoteArgs | SkipToken {
    if (!validateRoutingAPIInput(input)) {
      throw new Error(`Invalid routing API input: ${JSON.stringify(input)}`)
    }

    const { account, tokenIn, tokenOut, amount, tradeType, routerPreference, protocolPreferences } = input

    // Don't enable fee logic if this is a quote for pricing
    const sendPortionEnabled = routerPreference !== INTERNAL_ROUTER_PREFERENCE_PRICE

    const isPriorityOrder = routerPreference === RouterPreference.X && isPriorityOrdersEnabled
    const isArbitrum = tokenIn.chainId === UniverseChainId.ArbitrumOne

    const routingType = getRoutingType({
      canUseUniswapX,
      isPriorityOrder,
      isArbitrum,
      isDutchV3Enabled,
    })

    return {
      account,
      amount: amount.quotient.toString(),
      tokenInAddress: currencyAddressForSwapQuote(tokenIn),
      tokenInChainId: tokenIn.chainId,
      tokenInDecimals: tokenIn.wrapped.decimals,
      tokenInSymbol: tokenIn.wrapped.symbol,
      tokenOutAddress: currencyAddressForSwapQuote(tokenOut),
      tokenOutChainId: tokenOut.wrapped.chainId,
      tokenOutDecimals: tokenOut.wrapped.decimals,
      tokenOutSymbol: tokenOut.wrapped.symbol,
      routerPreference,
      protocolPreferences,
      tradeType,
      needsWrapIfUniswapX: tokenIn.isNative,
      uniswapXForceSyntheticQuotes: false,
      sendPortionEnabled,
      routingType,
    }
  }
}

export function validateRoutingAPIInput(input: RoutingAPIInput): input is RoutingAPIInputValidated {
  return (
    !!input.tokenIn &&
    !!input.tokenOut &&
    !!input.amount &&
    !input.tokenIn.equals(input.tokenOut) &&
    !input.tokenIn.wrapped.equals(input.tokenOut.wrapped)
  )
}

function getRoutingType(input: {
  canUseUniswapX: boolean
  isPriorityOrder: boolean
  isArbitrum: boolean
  isDutchV3Enabled: boolean
}): URAQuoteType {
  const { canUseUniswapX, isPriorityOrder, isArbitrum, isDutchV3Enabled } = input

  if (!canUseUniswapX) {
    return URAQuoteType.CLASSIC
  }

  if (isPriorityOrder) {
    return URAQuoteType.PRIORITY
  }

  if (isArbitrum) {
    return isDutchV3Enabled ? URAQuoteType.DUTCH_V3 : URAQuoteType.DUTCH_V1
  }

  return URAQuoteType.DUTCH_V2
}
