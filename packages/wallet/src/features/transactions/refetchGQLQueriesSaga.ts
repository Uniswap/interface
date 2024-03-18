import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { call, delay } from 'typed-redux-saga'
import {
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'
import {
  CurrencyId,
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
} from 'wallet/src/utils/currencyId'

type CurrencyIdToBalance = Record<CurrencyId, number>

const REFETCH_INTERVAL = ONE_SECOND_MS * 3
const MAX_REFETCH_ATTEMPTS = 30

export function* refetchGQLQueries({
  transaction,
  apolloClient,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
}) {
  const owner = transaction.from
  const currenciesWithBalToUpdate = getCurrenciesWithExpectedUpdates(transaction)
  const currencyIdToStartingBalance = readBalancesFromCache({
    owner,
    currencyIds: currenciesWithBalToUpdate,
    apolloClient,
  })

  // when there is a new local tx wait 1s then proactively refresh portfolio and activity queries
  yield* delay(REFETCH_INTERVAL)

  yield* call([apolloClient, apolloClient.refetchQueries], {
    include: [GQLQueries.PortfolioBalances, GQLQueries.TransactionList],
  })

  if (!currencyIdToStartingBalance) {
    return
  }

  let freshnessLag = REFETCH_INTERVAL
  // poll every second until the cache has updated balances for the relevant currencies
  for (let i = 0; i < MAX_REFETCH_ATTEMPTS; i += 1) {
    const currencyIdToUpdatedBalance = readBalancesFromCache({
      owner,
      currencyIds: currenciesWithBalToUpdate,
      apolloClient,
    })

    if (checkIfBalancesUpdated(currencyIdToStartingBalance, currencyIdToUpdatedBalance)) {
      break
    }

    yield* delay(REFETCH_INTERVAL)

    yield* call([apolloClient, apolloClient.refetchQueries], {
      include: [GQLQueries.PortfolioBalances, GQLQueries.TransactionList],
    })

    freshnessLag += REFETCH_INTERVAL
  }

  sendWalletAnalyticsEvent(WalletEventName.PortfolioBalanceFreshnessLag, {
    freshnessLag,
    updatedCurrencies: Object.keys(currencyIdToStartingBalance),
  })
}

// based on transaction data, determine which currencies we expect to see a balance update on
function getCurrenciesWithExpectedUpdates(
  transaction: TransactionDetails
): Set<CurrencyId> | undefined {
  const currenciesWithBalToUpdate: Set<CurrencyId> = new Set()
  const txChainId = transaction.chainId

  if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
    return undefined
  }

  // All txs besides FOR at least use gas so check for update of gas token
  currenciesWithBalToUpdate.add(buildNativeCurrencyId(txChainId))

  switch (transaction.typeInfo.type) {
    case TransactionType.Swap:
      currenciesWithBalToUpdate.add(transaction.typeInfo.inputCurrencyId.toLowerCase())
      currenciesWithBalToUpdate.add(transaction.typeInfo.outputCurrencyId.toLowerCase())
      break
    case TransactionType.Send:
      currenciesWithBalToUpdate.add(
        buildCurrencyId(txChainId, transaction.typeInfo.tokenAddress).toLowerCase()
      )
      break
    case TransactionType.Wrap:
      currenciesWithBalToUpdate.add(buildWrappedNativeCurrencyId(txChainId))
      break
  }

  return currenciesWithBalToUpdate
}

function readBalancesFromCache({
  owner,
  currencyIds,
  apolloClient,
}: {
  owner: string
  currencyIds: Set<CurrencyId> | undefined
  apolloClient: ApolloClient<NormalizedCacheObject>
}): CurrencyIdToBalance | undefined {
  if (!currencyIds?.size) {
    return undefined
  }
  const currencyIdsToUpdate = new Set(currencyIds)

  const currencyIdToBalance: CurrencyIdToBalance = Array.from(currencyIdsToUpdate).reduce(
    (currIdToBal, currencyId) => ({ ...currIdToBal, [currencyId]: 0 }), // assume 0 balance and update later if found in cache
    {}
  )

  const cachedBalancesData: Maybe<PortfolioBalancesQuery> = apolloClient.readQuery({
    query: PortfolioBalancesDocument,
    variables: { ownerAddress: owner },
  })

  for (const tokenData of cachedBalancesData?.portfolios?.[0]?.tokenBalances ?? []) {
    const chainId = fromGraphQLChain(tokenData?.token?.chain)

    if (!chainId) {
      continue
    }

    // backend represents native currency addresses as null but client uses a reserved address
    const tokenAddress = tokenData?.token?.address ?? getNativeAddress(chainId)
    const currencyId = buildCurrencyId(chainId, tokenAddress).toLowerCase()

    if (currencyIdsToUpdate.has(currencyId)) {
      currencyIdsToUpdate.delete(currencyId)
      currencyIdToBalance[currencyId] = tokenData?.quantity ?? 0
    }

    if (!currencyIdsToUpdate.size) {
      break
    }
  }

  return currencyIdToBalance
}

function checkIfBalancesUpdated(
  balance1: CurrencyIdToBalance,
  balance2: Maybe<CurrencyIdToBalance>
) {
  if (!balance2) {
    return true
  } // if no currencies to check, then assume balances are updated
  const currencyIds = Object.keys(balance1)
  for (const currencyId of currencyIds) {
    if (balance1[currencyId] === balance2[currencyId]) {
      return false
    }
  }

  return true
}
