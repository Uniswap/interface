import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { isExpiredMarginPlan } from 'uniswap/src/features/transactions/margin/isExpiredMarginPlan'
import {
  type PlanTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { describe, expect, it } from 'vitest'

const NOW = 1_800_000_000_000
const WETH = buildCurrencyId(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const USDC = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

function createPlan({
  status = TransactionStatus.Pending,
  ageMs = 21 * ONE_MINUTE_MS,
  isMargin = true,
}: { status?: TransactionStatus; ageMs?: number; isMargin?: boolean } = {}): PlanTransactionDetails {
  return {
    routing: TradingApi.Routing.CHAINED,
    id: 'plan-id',
    chainId: UniverseChainId.Mainnet,
    status,
    addedTime: NOW - ageMs,
    updatedTime: NOW - ageMs,
    from: '0x0000000000000000000000000000000000000001',
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.Plan,
      planId: 'plan-id',
      planStatus: TradingApi.PlanStatus.ACTIVE,
      stepDetails: [],
      tokenOutChainId: UniverseChainId.Mainnet,
      inputCurrencyId: USDC,
      outputCurrencyId: WETH,
      inputCurrencyAmountRaw: '0',
      outputCurrencyAmountRaw: '0',
      tradeType: 0,
      transactionHashes: [],
      marginAction: isMargin ? { action: 'open', collateralCurrencyId: WETH, debtCurrencyId: USDC } : undefined,
    },
  }
}

describe(isExpiredMarginPlan, () => {
  it.each([TransactionStatus.Pending, TransactionStatus.AwaitingAction])(
    'expires a %s margin plan past its deadline',
    (status) => {
      expect(isExpiredMarginPlan(createPlan({ status }), NOW)).toBe(true)
    },
  )

  it('keeps a margin plan within its deadline', () => {
    expect(isExpiredMarginPlan(createPlan({ ageMs: 19 * ONE_MINUTE_MS }), NOW)).toBe(false)
  })

  it.each([TransactionStatus.Success, TransactionStatus.Failed])('leaves a %s margin plan alone', (status) => {
    expect(isExpiredMarginPlan(createPlan({ status }), NOW)).toBe(false)
  })

  it('leaves a non-margin plan alone', () => {
    expect(isExpiredMarginPlan(createPlan({ isMargin: false }), NOW)).toBe(false)
  })
})
