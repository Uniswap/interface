import type { OffRampTransferDetailsRequest, OffRampTransferDetailsResponse } from '@universe/api'
import dayjs from 'dayjs'
import { ForApiClient } from 'uniswap/src/data/apiClients/forApi/ForApiClient'
import { extractFORTransactionDetails } from 'uniswap/src/features/activity/extract/extractFiatOnRampTransactionDetails'
import { FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { isOffRampTransaction } from 'wallet/src/features/transactions/utils'

const FIAT_ONRAMP_STALE_TX_TIMEOUT = ONE_MINUTE_MS * 20
const FIAT_ONRAMP_FORCE_FETCH_TX_TIMEOUT = ONE_MINUTE_MS * 5

/**
 * Utility to fetch FOR transactions
 */
export async function fetchFORTransaction({
  previousTransactionDetails,
  forceFetch,
  activeAccountAddress,
}: {
  previousTransactionDetails: FORTransactionDetails
  forceFetch: boolean
  activeAccountAddress: Address | null
}): Promise<FORTransactionDetails | undefined> {
  const isOffRamp = isOffRampTransaction(previousTransactionDetails)
  const isRecent = dayjs(previousTransactionDetails.addedTime).isAfter(
    dayjs().subtract(FIAT_ONRAMP_FORCE_FETCH_TX_TIMEOUT, 'ms'),
  )
  const requestParams = {
    sessionId: previousTransactionDetails.id,
    // Force fetch if requested or for the first 3 minutes after the transaction was added
    forceFetch: forceFetch || isRecent,
  }

  const { transaction } = await ForApiClient.getTransaction(requestParams)
  if (!transaction) {
    const isStale = dayjs(previousTransactionDetails.addedTime).isBefore(
      dayjs().subtract(FIAT_ONRAMP_STALE_TX_TIMEOUT, 'ms'),
    )

    if (isStale) {
      logger.debug(
        'fiatOnRamp/api',
        'fetchFiatOnRampTransaction',
        `Transaction with id ${previousTransactionDetails.id} not found.`,
      )

      return {
        ...previousTransactionDetails,
        // use `Unknown` status to denote a transaction missing from backend
        // this transaction will later get deleted
        status: TransactionStatus.Unknown,
      }
    } else {
      logger.debug(
        'fiatOnRamp/api',
        'fetchFiatOnRampTransaction',
        `Transaction with id ${previousTransactionDetails.id} not found, but not stale yet (${dayjs()
          .subtract(previousTransactionDetails.addedTime, 'ms')
          .unix()}s old).`,
      )

      return previousTransactionDetails
    }
  }

  return extractFORTransactionDetails({ transaction, isOffRamp, activeAccountAddress })
}

export async function fetchOffRampTransferDetails({
  sessionId,
  baseCurrencyCode,
  baseCurrencyAmount,
  depositWalletAddress,
}: {
  sessionId: string | null
  baseCurrencyCode: string | null
  baseCurrencyAmount: number | null
  depositWalletAddress: string | null
}): Promise<OffRampTransferDetailsResponse> {
  let requestParams: OffRampTransferDetailsRequest | undefined

  if (baseCurrencyCode && baseCurrencyAmount && depositWalletAddress) {
    requestParams = {
      moonpayDetails: {
        baseCurrencyCode,
        baseCurrencyAmount,
        depositWalletAddress,
      },
    } as unknown as OffRampTransferDetailsRequest
  } else if (sessionId) {
    requestParams = {
      meldDetails: {
        sessionId,
      },
    } as unknown as OffRampTransferDetailsRequest
  }

  if (!requestParams) {
    throw new Error('Invalid request params: either moonpay or meld details required')
  }

  return ForApiClient.getOffRampTransferDetails(requestParams)
}
