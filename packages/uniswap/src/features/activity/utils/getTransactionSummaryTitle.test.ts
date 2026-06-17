import type { AppTFunction } from 'ui/src/i18n/types'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import {
  type TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { describe, expect, it } from 'vitest'

// Identity `t` so assertions read against i18n keys rather than translated copy.
const t = ((key: string) => key) as AppTFunction

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

describe('getTransactionSummaryTitle - AuctionLaunch', () => {
  it.each([
    [TransactionStatus.Pending, 'toucan.createAuction.transaction.pending'],
    [TransactionStatus.Success, 'toucan.createAuction.transaction.success'],
    [TransactionStatus.Failed, 'toucan.createAuction.transaction.failed'],
    [TransactionStatus.Cancelling, 'toucan.createAuction.transaction.canceling'],
    [TransactionStatus.Canceled, 'toucan.createAuction.transaction.canceled'],
  ])('maps %s to the matching auction-launch title', (status, expectedKey) => {
    expect(getTransactionSummaryTitle(auctionLaunchTx(status), t)).toBe(expectedKey)
  })
})
