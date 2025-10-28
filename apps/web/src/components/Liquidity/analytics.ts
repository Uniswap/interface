import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { LiquidityAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

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
}): Omit<LiquidityAnalyticsProperties, 'transaction_hash'> {
  return {
    ...trace,
    label: [currency0.symbol, currency1.symbol].join('/'),
    type: ProtocolVersion[version],
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
  }
}

export function getLiquidityEventName(
  stepType: TransactionStepType,
):
  | LiquidityEventName.AddLiquiditySubmitted
  | LiquidityEventName.RemoveLiquiditySubmitted
  | LiquidityEventName.MigrateLiquiditySubmitted
  | LiquidityEventName.CollectLiquiditySubmitted {
  switch (stepType) {
    case TransactionStepType.IncreasePositionTransaction:
    case TransactionStepType.IncreasePositionTransactionAsync:
      return LiquidityEventName.AddLiquiditySubmitted
    case TransactionStepType.DecreasePositionTransaction:
      return LiquidityEventName.RemoveLiquiditySubmitted
    case TransactionStepType.MigratePositionTransaction:
    case TransactionStepType.MigratePositionTransactionAsync:
      return LiquidityEventName.MigrateLiquiditySubmitted
    case TransactionStepType.CollectFeesTransactionStep:
      return LiquidityEventName.CollectLiquiditySubmitted
    default:
      throw new Error('Unexpected step type')
  }
}
