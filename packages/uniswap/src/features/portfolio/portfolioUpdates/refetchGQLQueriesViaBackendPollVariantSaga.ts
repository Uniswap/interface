import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { call, delay, select } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { GQL_MAINNET_CHAINS, GQL_TESTNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, NetworkRequestsConfigKey } from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'uniswap/src/features/portfolio/portfolioUpdates/constants'
import { getCurrenciesWithExpectedUpdates } from 'uniswap/src/features/portfolio/portfolioUpdates/getCurrenciesWithExpectedUpdates'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

type CurrencyIdToBalance = Record<CurrencyId, number>

const REFETCH_INTERVAL = ONE_SECOND_MS * 3
const MAX_REFETCH_ATTEMPTS_FALLBACK = 30

export function* refetchGQLQueriesViaBackendPollVariant({
  transaction,
  apolloClient,
  activeAddress,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
}) {
  const owner = transaction.from
  const isTestnetMode = yield* select(selectIsTestnetModeEnabled)

  const currenciesWithBalToUpdate = getCurrenciesWithExpectedUpdates(transaction)
  const currencyIdToStartingBalance = readBalancesFromCache({
    owner,
    currencyIds: currenciesWithBalToUpdate,
    apolloClient,
    isTestnetMode,
  })

  const maxRefetchAttempts = getDynamicConfigValue(
    DynamicConfigs.NetworkRequests,
    NetworkRequestsConfigKey.BalanceMaxRefetchAttempts,
    MAX_REFETCH_ATTEMPTS_FALLBACK,
  )

  if (owner !== activeAddress) {
    // We can ignore if the transaction does not belong to the active account.
    return
  }

  // When there is a new local tx, we wait `REFETCH_INTERVAL` and then refetch all queries.
  yield* delay(REFETCH_INTERVAL)

  // We refetch all queries for the Tokens, NFT and Activity tabs.
  yield* call([apolloClient, apolloClient.refetchQueries], { include: GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE })

  if (!currencyIdToStartingBalance) {
    return
  }

  let freshnessLag = REFETCH_INTERVAL
  let i = 0
  let lastUpdatedBalances: CurrencyIdToBalance | undefined
  // We poll every `REFETCH_INTERVAL` until we see updated balances for the relevant currencies.
  while (i < maxRefetchAttempts) {
    const currencyIdToUpdatedBalance = readBalancesFromCache({
      owner,
      currencyIds: currenciesWithBalToUpdate,
      apolloClient,
      isTestnetMode,
    })
    lastUpdatedBalances = currencyIdToUpdatedBalance
    if (checkIfBalancesUpdated(currencyIdToStartingBalance, currencyIdToUpdatedBalance)) {
      break
    }

    yield* delay(REFETCH_INTERVAL)

    const currentActiveAddress = activeAddress
    if (owner !== currentActiveAddress) {
      // We stop polling if the user has switched accounts.
      // A call to `refetchQueries` wouldn't be useful in this case because no query with the transaction's owner is currently being watched.
      break
    }

    // We only want to refetch `PortfolioBalances`, as this is the only query needed to check the updated balances.
    yield* call([apolloClient, apolloClient.refetchQueries], {
      include: [GQLQueries.PortfolioBalances],
    })

    freshnessLag += REFETCH_INTERVAL
    i += 1
  }

  // Log how many iterations it took to get the balances, and the currencyIds that were being compared
  if (i >= 10) {
    logger.info('refetchGQLQueriesSaga', 'refetchGQLQueries', 'Large balance freshness lag', {
      iterations: i,
      startingBalances: currencyIdToStartingBalance,
      lastUpdatedBalances,
      currencyIds: currenciesWithBalToUpdate,
    })
  }

  sendAnalyticsEvent(WalletEventName.PortfolioBalanceFreshnessLag, {
    freshnessLag,
    updatedCurrencies: Object.keys(currencyIdToStartingBalance),
  })
}

function readBalancesFromCache({
  owner,
  currencyIds,
  apolloClient,
  isTestnetMode,
}: {
  owner: string
  currencyIds: Set<CurrencyId> | undefined
  apolloClient: ApolloClient<NormalizedCacheObject>
  isTestnetMode: boolean
}): CurrencyIdToBalance | undefined {
  if (!currencyIds?.size) {
    return undefined
  }
  const currencyIdsToUpdate = new Set(currencyIds)

  const currencyIdToBalance: CurrencyIdToBalance = Array.from(currencyIdsToUpdate).reduce(
    (currIdToBal, currencyId) => ({ ...currIdToBal, [currencyId]: 0 }), // assume 0 balance and update later if found in cache
    {},
  )

  const chains = isTestnetMode ? GQL_TESTNET_CHAINS : GQL_MAINNET_CHAINS

  const cachedBalancesData = apolloClient.readQuery<PortfolioBalancesQuery>({
    query: PortfolioBalancesDocument,
    variables: { ownerAddress: owner, chains },
  })

  if (!cachedBalancesData) {
    logger.info('refetchGQLQueriesSaga', 'readBalancesFromCache', 'No cached balances data', {
      currencyIds: currencyIdsToUpdate,
    })
  }

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

function checkIfBalancesUpdated(balance1: CurrencyIdToBalance, balance2: Maybe<CurrencyIdToBalance>): boolean {
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
