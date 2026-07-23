import { SharedEventName } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { SharedQueryClient } from '@universe/api'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { LiquidityAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { currencyId, currencyIdToAddress, getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export function logPositionCardClick(position: PositionInfo, trace: ITraceContext): void {
  sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
    element: ElementName.LiquidityPositionCard,
    pool_address: position.poolId,
    chain_id: position.chainId,
    ...trace,
  })
}

export function logCollectFeesClick(position: PositionInfo, trace: ITraceContext): void {
  sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
    element: ElementName.CollectFeesButton,
    pool_address: position.poolId,
    token0_symbol: position.currency0Amount.currency.symbol,
    token1_symbol: position.currency1Amount.currency.symbol,
    ...trace,
  })
}

export function getLPBaseAnalyticsProperties({
  trace,
  fee,
  tickSpacing,
  tickLower,
  tickUpper,
  hook,
  currency0,
  currency1,
  currency0AmountUsd,
  currency1AmountUsd,
  version,
  poolId,
  isCentralizedPricesEnabled,
}: {
  trace: ITraceContext
  fee?: number | string // denominated in hundredths of bips
  tickSpacing: number | undefined
  tickLower: number | undefined
  tickUpper: number | undefined
  hook: string | undefined
  currency0: Currency
  currency1: Currency
  currency0AmountUsd: Maybe<CurrencyAmount<Currency>>
  currency1AmountUsd: Maybe<CurrencyAmount<Currency>>
  version: ProtocolVersion
  poolId?: string
  isCentralizedPricesEnabled: boolean
}): Omit<LiquidityAnalyticsProperties, 'transaction_hash'> {
  return {
    ...trace,
    label: [currency0.symbol, currency1.symbol].join('/'),
    type: ProtocolVersion[version],
    protocol_version: version,
    fee_tier: (typeof fee === 'string' ? parseInt(fee) : fee) ?? FeeAmount.MEDIUM,
    tick_spacing: tickSpacing,
    tick_lower: tickLower,
    tick_upper: tickUpper,
    hook,
    pool_address: poolId,
    chain_id: currency0.chainId,
    baseCurrencyId: currencyIdToAddress(currencyId(currency0)),
    quoteCurrencyId: currencyIdToAddress(currencyId(currency1)),
    token0AmountUSD: currency0AmountUsd ? parseFloat(currency0AmountUsd.toExact()) : undefined,
    token1AmountUSD: currency1AmountUsd ? parseFloat(currency1AmountUsd.toExact()) : undefined,
    currencyInfo0Decimals: currency0.decimals,
    currencyInfo1Decimals: currency1.decimals,
    price_source: getDisplayedPriceSource({
      isCentralizedPricesEnabled,
      surface: 'usdc',
      chainId: currency0.chainId,
      address: getCurrencyAddressForAnalytics(currency0),
      queryClient: SharedQueryClient,
    }),
  }
}
