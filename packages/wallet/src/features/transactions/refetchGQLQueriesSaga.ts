import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { call, delay, select } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { GQL_MAINNET_CHAINS_MUTABLE, GQL_TESTNET_CHAINS_MUTABLE } from 'uniswap/src/constants/chains'
import {
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
// eslint-disable-next-line no-restricted-imports
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { buildCurrencyId, buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'wallet/src/utils/currencyId'

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
  const isTestnetFlagEnabled = getFeatureFlag(FeatureFlags.TestnetMode)
  const isTestnetModeEnabled = yield* select(selectIsTestnetModeEnabled)
  const isTestnetMode = isTestnetFlagEnabled && isTestnetModeEnabled

  const currenciesWithBalToUpdate = getCurrenciesWithExpectedUpdates(transaction)
  const currencyIdToStartingBalance = readBalancesFromCache({
    owner,
    currencyIds: currenciesWithBalToUpdate,
    apolloClient,
    isTestnetMode,
  })

  const activeAddress = yield* select(selectActiveAccountAddress)
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

  // We poll every `REFETCH_INTERVAL` until we see updated balances for the relevant currencies.
  for (let i = 0; i < MAX_REFETCH_ATTEMPTS; i += 1) {
    const currencyIdToUpdatedBalance = readBalancesFromCache({
      owner,
      currencyIds: currenciesWithBalToUpdate,
      apolloClient,
      isTestnetMode,
    })

    if (checkIfBalancesUpdated(currencyIdToStartingBalance, currencyIdToUpdatedBalance)) {
      break
    }

    yield* delay(REFETCH_INTERVAL)

    const currentActiveAddress = yield* select(selectActiveAccountAddress)
    if (owner !== currentActiveAddress) {
      // We stop polling if the user has switched accounts.
      // A call to `refetchQueries` wouldn't be useful in this case because no query with the transaction's owner is currently being watched.
      break
    }

    // We only want to refetch `PortfolioBalances`, as this is the only query needed to check the updated balances.
    yield* call([apolloClient, apolloClient.refetchQueries], { include: [GQLQueries.PortfolioBalances] })

    freshnessLag += REFETCH_INTERVAL
  }

  sendAnalyticsEvent(WalletEventName.PortfolioBalanceFreshnessLag, {
    freshnessLag,
    updatedCurrencies: Object.keys(currencyIdToStartingBalance),
  })
}

// based on transaction data, determine which currencies we expect to see a balance update on
function getCurrenciesWithExpectedUpdates(transaction: TransactionDetails): Set<CurrencyId> | undefined {
  const currenciesWithBalToUpdate: Set<CurrencyId> = new Set()
  const txChainId = transaction.chainId

  // All txs besides FOR at least use gas so check for update of gas token
  currenciesWithBalToUpdate.add(buildNativeCurrencyId(txChainId))

  switch (transaction.typeInfo.type) {
    case TransactionType.Swap:
    case TransactionType.Bridge:
      currenciesWithBalToUpdate.add(transaction.typeInfo.inputCurrencyId.toLowerCase())
      currenciesWithBalToUpdate.add(transaction.typeInfo.outputCurrencyId.toLowerCase())
      break
    case TransactionType.Send:
      currenciesWithBalToUpdate.add(buildCurrencyId(txChainId, transaction.typeInfo.tokenAddress).toLowerCase())
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

  const chains = isTestnetMode ? GQL_TESTNET_CHAINS_MUTABLE : GQL_MAINNET_CHAINS_MUTABLE

  const cachedBalancesData = apolloClient.readQuery<PortfolioBalancesQuery>({
    query: PortfolioBalancesDocument,
    variables: { ownerAddress: owner, chains },
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

function checkIfBalancesUpdated(balance1: CurrencyIdToBalance, balance2: Maybe<CurrencyIdToBalance>) {
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
