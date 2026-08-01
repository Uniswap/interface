import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { AppTFunction } from 'ui/src/i18n/types'
import { DAI } from 'uniswap/src/constants/tokens'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  type PlanTransactionInfo,
  type TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'

// Identity `t` so assertions read against i18n keys rather than translated copy.
const t = ((key: string) => key) as AppTFunction

function getTitle(
  tx: Pick<TransactionDetails, 'typeInfo' | 'status'>,
  options?: { isEarnActivityDisplayEnabled?: boolean },
): string | undefined {
  return getTransactionSummaryTitle({ tx, t, ...options })
}

function auctionLaunchTx(status: TransactionStatus): Pick<TransactionDetails, 'typeInfo' | 'status'> {
  return {
    status,
    typeInfo: {
      type: TransactionType.AuctionLaunch,
      requestId: 'request-1',
      predictedAuctionAddress: '0xAuction',
      predictedTokenAddress: '0xToken',
    },
  } as Pick<TransactionDetails, 'typeInfo' | 'status'>
}

function createPlanTypeInfo(earnAction: TradingApi.EarnAction): PlanTransactionInfo {
  const currencyId = buildCurrencyId(UniverseChainId.Mainnet, DAI.address)

  return {
    type: TransactionType.Plan,
    planId: 'plan-id',
    planStatus: TradingApi.PlanStatus.AWAITING_ACTION,
    stepDetails: [],
    tokenOutChainId: UniverseChainId.Mainnet,
    inputCurrencyId: currencyId,
    outputCurrencyId: currencyId,
    inputCurrencyAmountRaw: '1000000',
    outputCurrencyAmountRaw: '1000000',
    tradeType: TradeType.EXACT_INPUT,
    earnAction,
    transactionHashes: [],
  }
}

describe('getTransactionSummaryTitle - AuctionLaunch', () => {
  it.each([
    [TransactionStatus.Pending, 'toucan.createAuction.transaction.pending'],
    [TransactionStatus.Success, 'toucan.createAuction.transaction.success'],
    [TransactionStatus.Failed, 'toucan.createAuction.transaction.failed'],
    [TransactionStatus.Cancelling, 'toucan.createAuction.transaction.canceling'],
    [TransactionStatus.Canceled, 'toucan.createAuction.transaction.canceled'],
  ])('maps %s to the matching auction-launch title', (status, expectedKey) => {
    expect(getTitle(auctionLaunchTx(status))).toBe(expectedKey)
  })
})

describe('getTransactionSummaryTitle - Earn plans', () => {
  it('uses Earn-specific interrupted titles for interrupted Earn plans', () => {
    expect(
      getTitle({
        typeInfo: createPlanTypeInfo(TradingApi.EarnAction.DEPOSIT),
        status: TransactionStatus.AwaitingAction,
      }),
    ).toBe('transaction.status.deposit.interrupted')

    expect(
      getTitle({
        typeInfo: createPlanTypeInfo(TradingApi.EarnAction.WITHDRAW),
        status: TransactionStatus.AwaitingAction,
      }),
    ).toBe('transaction.status.withdraw.interrupted')
  })

  // Earn plan titles route through the canonical planActivityTitles mapping shared with
  // notifications and the activity tables.
  it.each([
    [TransactionStatus.Success, 'transaction.status.deposit.success'],
    [TransactionStatus.Pending, 'transaction.status.deposit.pending'],
    [TransactionStatus.Failed, 'transaction.status.deposit.failed'],
    [TransactionStatus.Cancelling, 'transaction.status.deposit.canceling'],
    [TransactionStatus.Canceled, 'transaction.status.deposit.canceled'],
  ])('maps Earn deposit plan %s to the canonical title key', (status, expectedKey) => {
    expect(
      getTitle({
        typeInfo: createPlanTypeInfo(TradingApi.EarnAction.DEPOSIT),
        status,
      }),
    ).toBe(expectedKey)
  })

  it.each([
    [TransactionStatus.Success, 'transaction.status.withdraw.success'],
    [TransactionStatus.Pending, 'transaction.status.withdraw.pending'],
    [TransactionStatus.Failed, 'transaction.status.withdraw.failed'],
    [TransactionStatus.Cancelling, 'transaction.status.withdraw.canceling'],
    [TransactionStatus.Canceled, 'transaction.status.withdraw.canceled'],
  ])('maps Earn withdraw plan %s to the canonical title key', (status, expectedKey) => {
    expect(
      getTitle({
        typeInfo: createPlanTypeInfo(TradingApi.EarnAction.WITHDRAW),
        status,
      }),
    ).toBe(expectedKey)
  })

  it('maps statuses without a dedicated Earn title to interrupted (canonical fallback)', () => {
    expect(
      getTitle({
        typeInfo: createPlanTypeInfo(TradingApi.EarnAction.DEPOSIT),
        status: TransactionStatus.Expired,
      }),
    ).toBe('transaction.status.deposit.interrupted')
  })

  it('uses generic plan titles when Earn activity display is disabled', () => {
    expect(
      getTitle(
        {
          typeInfo: createPlanTypeInfo(TradingApi.EarnAction.DEPOSIT),
          status: TransactionStatus.AwaitingAction,
        },
        { isEarnActivityDisplayEnabled: false },
      ),
    ).toBe('transaction.status.plan.interrupted')
  })
})
