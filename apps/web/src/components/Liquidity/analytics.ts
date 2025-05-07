import { LiquidityEventName } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { LiquidityAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/types/steps'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export function getLPBaseAnalyticsProperties({
  trace,
  fee,
  currency0,
  currency1,
  currency0AmountUsd,
  currency1AmountUsd,
  version,
  poolId,
}: {
  trace: ITraceContext
  fee?: number | string // denominated in hundredths of bips
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
  | LiquidityEventName.ADD_LIQUIDITY_SUBMITTED
  | LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED
  | LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED
  | LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED {
  switch (stepType) {
    case TransactionStepType.IncreasePositionTransaction:
    case TransactionStepType.IncreasePositionTransactionAsync:
      return LiquidityEventName.ADD_LIQUIDITY_SUBMITTED
    case TransactionStepType.DecreasePositionTransaction:
      return LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED
    case TransactionStepType.MigratePositionTransactionStep:
    case TransactionStepType.MigratePositionTransactionStepAsync:
      return LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED
    case TransactionStepType.CollectFeesTransactionStep:
      return LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED
    default:
      throw new Error('Unexpected step type')
  }
}
