import dayjs from 'dayjs'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { extractFORTransactionDetails } from 'uniswap/src/features/activity/extract/extractFiatOnRampTransactionDetails'
import { FOR_API_HEADERS } from 'uniswap/src/features/fiatOnRamp/constants'
import {
  FORTransactionDetails,
  FORTransactionResponse,
  OffRampTransferDetailsRequest,
  OffRampTransferDetailsResponse,
} from 'uniswap/src/features/fiatOnRamp/types'
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

  const res = await fetch(`${uniswapUrls.forApiUrl}/Transaction`, {
    headers: FOR_API_HEADERS,
    method: 'POST',
    body: JSON.stringify(requestParams),
  })

  const { transaction }: FORTransactionResponse = await res.json()
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
    }
  } else if (sessionId) {
    requestParams = {
      meldDetails: {
        sessionId,
      },
    }
  }

  const res = await fetch(`${uniswapUrls.forApiUrl}/OffRampTransferDetails`, {
    headers: FOR_API_HEADERS,
    method: 'POST',
    body: JSON.stringify(requestParams),
  })

  return res.json() as Promise<OffRampTransferDetailsResponse>
}
