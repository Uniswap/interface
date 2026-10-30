import { TradingApi } from '@universe/api'
import type {
  MarginBounds,
  MarginGasEstimate,
  MarginPaymentSwapQuote,
  MarginQuoteDisplay,
  MarginQuoteLeg,
  MarginQuoteResponse,
  MarginSwapConfig,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { type MarginActionKey } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// Adapts the generated /margin/quote wire response (an `execution` envelope carrying
// `operations` + `funding`) into the FE view the terminal reads (flat identity + per-leg `bounds` +
// `swapConfig`/`paymentSwap`). Kept at the client boundary so the ~18 consumers stay stable while the
// wire types stay generated — a BE rename now fails to compile HERE rather than silently at runtime.

// The exposure/counter decimals the view renders with are the market's, threaded in by the caller
// (which resolves the market) rather than re-derived here — a quote adapter has no token metadata,
// and an address-keyed guess mis-scales anything off the mainnet list.
export type MarginTokenDecimals = { exposure: number; counter: number }

function assertNever(value: never): never {
  throw new Error(`Unhandled margin venue: ${String(value)}`)
}

function wireVenueToView(venue: TradingApi.MarginVenue): MarginVenue {
  switch (venue) {
    case TradingApi.MarginVenue.AAVE_V3:
      return 'AAVE_V3'
    case TradingApi.MarginVenue.AAVE_V4:
      return 'AAVE_V4'
    case TradingApi.MarginVenue.MORPHO:
      return 'MORPHO'
    default:
      return assertNever(venue)
  }
}

const INTENT_TO_ACTION_KEY: Readonly<Record<TradingApi.MarginIntent, MarginActionKey>> = {
  [TradingApi.MarginIntent.MARGIN_INTENT_OPEN]: 'open',
  [TradingApi.MarginIntent.MARGIN_INTENT_CLOSE]: 'close',
  [TradingApi.MarginIntent.MARGIN_INTENT_INCREASE_LEVERAGE]: 'increaseLeverage',
  [TradingApi.MarginIntent.MARGIN_INTENT_DECREASE_LEVERAGE]: 'decreaseLeverage',
  [TradingApi.MarginIntent.MARGIN_INTENT_ADD_EQUITY]: 'addEquity',
  [TradingApi.MarginIntent.MARGIN_INTENT_WITHDRAW_EQUITY]: 'withdrawEquity',
  [TradingApi.MarginIntent.MARGIN_INTENT_ADD_EQUITY_AND_INCREASE_LEVERAGE]: 'addEquityAndIncreaseLeverage',
  [TradingApi.MarginIntent.MARGIN_INTENT_ADD_EQUITY_AND_DECREASE_LEVERAGE]: 'addEquityAndDecreaseLeverage',
  [TradingApi.MarginIntent.MARGIN_INTENT_WITHDRAW_EQUITY_AND_INCREASE_LEVERAGE]: 'withdrawEquityAndIncreaseLeverage',
  [TradingApi.MarginIntent.MARGIN_INTENT_WITHDRAW_EQUITY_AND_DECREASE_LEVERAGE]: 'withdrawEquityAndDecreaseLeverage',
}

// The view keeps per-on-chain-call `bounds` groups; the wire keeps a flat `operations` list keyed by
// type. Fold operations back into the groups the consumers read. The pre-swap's delivered equity lives
// on `funding.output`, not on the INCREASE operation, so it is threaded in here.
function operationsToBounds(
  operations: readonly TradingApi.MarginOperation[],
  funding: TradingApi.MarginFunding | undefined,
): MarginBounds {
  const bounds: MarginBounds = {}
  for (const op of operations) {
    switch (op.type) {
      case TradingApi.MarginOperationType.INCREASE_POSITION:
        bounds.increase = {
          collateralToBuy: op.collateralToBuy,
          maxDebtIn: op.maxDebtIn,
          expectedEquityDelta: funding?.output.amount,
          minEquityDelta: funding?.output.minimumAmount,
          minHopPrice: op.minHopPrice,
          effectivePrice: op.effectivePrice,
        }
        break
      case TradingApi.MarginOperationType.DECREASE_POSITION:
        bounds.decrease = {
          debtToRepay: op.debtToRepay,
          maxCollateralIn: op.maxCollateralIn,
          minHopPrice: op.minHopPrice,
          effectivePrice: op.effectivePrice,
          maxLtvAfter: op.maxLtvAfter,
        }
        break
      case TradingApi.MarginOperationType.ADD_COLLATERAL:
      case TradingApi.MarginOperationType.WITHDRAW:
        bounds.equity = {
          equityDelta: op.amount ?? '0',
          effectivePrice: op.effectivePrice,
          maxLtvAfter: op.maxLtvAfter,
        }
        break
      case TradingApi.MarginOperationType.SWEEP:
      default:
        break
    }
  }
  return bounds
}

function mapGasEstimate(gas: TradingApi.MarginQuoteResponse['gasEstimate']): MarginGasEstimate | undefined {
  const tier = gas?.eip1559 ?? gas?.legacy
  if (!tier?.gasLimit || !tier.gasFee) {
    return undefined
  }
  return { gasLimit: tier.gasLimit, gasFeeWei: tier.gasFee }
}

function mapDisplay(display: TradingApi.MarginDisplay): MarginQuoteDisplay {
  return {
    size: display.size,
    leverage: display.leverage,
    effectivePrice: display.effectivePrice,
    liquidationPrice: display.liquidationPrice,
    borrowRate: display.borrowRate,
    healthFactor: display.healthFactor,
    oraclePrice: display.oraclePrice,
    collateralReturned: display.collateralReturned,
    debtRepaid: display.debtRepaid,
  }
}

function mapPaymentSwap(funding: TradingApi.MarginFunding | undefined): MarginPaymentSwapQuote | undefined {
  if (!funding?.output.amount) {
    return undefined
  }
  return {
    route: [],
    feeBps: 0,
    impactBps: funding.priceImpact === undefined ? '' : String(funding.priceImpact),
    expectedOut: funding.output.amount,
    minOut: funding.output.minimumAmount,
  }
}

function mapSwapConfig(funding: TradingApi.MarginFunding | undefined): MarginSwapConfig | undefined {
  if (!funding) {
    return undefined
  }
  return {
    token: funding.input.token,
    amount: funding.input.amount,
    minAmount: funding.output.minimumAmount,
    minBridgeOut: funding.minBridgeOut,
  }
}

// One venue leg in v1. Venue-term collateral/debt are derived from the trader pair + direction (LONG
// collateral = exposure, debt = counter; SHORT flips); per-leg risk mirrors the position-level display
// since there is a single leg; equityShare is the whole position (1e18).
function toViewLegs(execution: TradingApi.MarginExecution, display: TradingApi.MarginDisplay): MarginQuoteLeg[] {
  const leg = execution.legs[0]
  if (!leg) {
    return []
  }
  const isShort = execution.direction === TradingApi.MarginDirection.SHORT
  return [
    {
      venue: wireVenueToView(leg.venue),
      collateralToken: isShort ? execution.counterToken : execution.exposureToken,
      debtToken: isShort ? execution.exposureToken : execution.counterToken,
      subId: leg.subId,
      size: display.size,
      equityShare: '1000000000000000000',
      liquidationPrice: display.liquidationPrice,
      borrowRate: display.borrowRate,
      bounds: operationsToBounds(leg.operations, execution.funding),
    },
  ]
}

export function toMarginQuoteView(
  wire: TradingApi.MarginQuoteResponse,
  tokenDecimals: MarginTokenDecimals,
): MarginQuoteResponse {
  const execution = wire.execution
  const direction = execution.direction
  return {
    requestId: wire.requestId,
    // Carry the wire execution UNTOUCHED: POST /plan echoes `marginQuote.execution` verbatim
    // (assertEchoIsWellFormed) and re-derives all bounds from it; the flat fields below are the
    // terminal's display view, which /plan ignores.
    execution,
    action: INTENT_TO_ACTION_KEY[execution.intent],
    chainId: execution.positionChainId,
    swapper: execution.swapper,
    direction,
    exposureToken: {
      address: execution.exposureToken,
      chainId: execution.positionChainId,
      decimals: tokenDecimals.exposure,
    },
    counterToken: {
      address: execution.counterToken,
      chainId: execution.positionChainId,
      decimals: tokenDecimals.counter,
    },
    positionId: execution.positionId,
    leverageTarget: execution.leverageTarget,
    slippageTolerance: execution.slippageTolerance,
    swapConfig: mapSwapConfig(execution.funding),
    display: mapDisplay(wire.display),
    legs: toViewLegs(execution, wire.display),
    deadlineSuggestion: '',
    gasEstimate: mapGasEstimate(wire.gasEstimate),
    paymentSwap: mapPaymentSwap(execution.funding),
  }
}
