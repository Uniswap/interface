import { createAdaptiveRefetchContext } from 'appGraphql/data/apollo/AdaptiveRefetch'
import type { AssetActivityItem } from 'appGraphql/data/util'
import { isOpenLimitOrder } from 'appGraphql/data/util'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import ms from 'ms'
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchOpenLimitOrders } from 'state/activity/polling/orders'
import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import {
  ActivityWebQueryResult,
  ActivityWebQueryVariables,
  useActivityWebLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'

const { Provider: AdaptiveAssetActivityProvider, useQuery: useAssetActivityQuery } =
  createAdaptiveRefetchContext<ActivityWebQueryResult>()

const PAGE_SIZE = 100
const PAGE_NUMBER_LIMIT = 20
const INITIAL_PAGE = 1

function AssetActivityProviderInternal({ children }: PropsWithChildren) {
  const account = useAccount()
  const previousAccount = usePrevious(account.address)
  const { isTestnetModeEnabled, gqlChains } = useEnabledChains()
  const previousIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  const fiatOnRampTransactions = useFiatOnRampTransactions()

  const [lazyFetch, query] = useActivityWebLazyQuery()
  const [additionalLimitOrders, setAdditionalLimitOrders] = useState<AssetActivityItem[]>([])
  const [isLoadingAdditional, setIsLoadingAdditional] = useState(false)

  const transactionIds = useMemo(
    () => Object.values(fiatOnRampTransactions).map((tx) => tx.externalSessionId),
    [fiatOnRampTransactions],
  )

  const baseVariables = useMemo<ActivityWebQueryVariables>(
    () => ({
      account: account.address ?? '',
      chains: gqlChains,
      // Backend will return off-chain activities even if gqlChains are all testnets.
      includeOffChain: !isTestnetModeEnabled,
      // Include the externalsessionIDs of all FOR transactions in the local store,
      // so that the backend can find the transactions without signature authentication.
      // Note: No FOR transactions are included in activity without explicity passing IDs from local storage
      onRampTransactionIDs: transactionIds,
      pageSize: PAGE_SIZE,
      page: INITIAL_PAGE,
    }),
    [account.address, gqlChains, isTestnetModeEnabled, transactionIds],
  )

  // Fetch additional limit orders beyond the first page to ensure all are shown
  // TODO(PORT-429): update once migrated to REST + endpoint supports filtering by limit orders
  const fetchAdditionalOpenLimitOrders = useCallback(async () => {
    if (!account.address) {
      return
    }

    setIsLoadingAdditional(true)
    let additionalOpenLimitOrders: AssetActivityItem[] = []
    let page = INITIAL_PAGE + 1
    let hasMore = true

    try {
      const firstPageActivities = query.data?.portfolios?.[0]?.assetActivities || []
      const firstPageLimitOrders = firstPageActivities.filter(isOpenLimitOrder)
      let totalExpectedLimitOrders: number | undefined
      // If our first page is full, we potentially have further limit orders to fetch
      // In this case, fetch open limit orders from limit-orders endpoint to know how many limit orders we need to retrieve from the rest of activity pages
      if (firstPageActivities.length === PAGE_SIZE) {
        try {
          const allOpenLimitOrders = await fetchOpenLimitOrders(account.address)
          totalExpectedLimitOrders = allOpenLimitOrders.length

          // If we already have all orders from first page, return
          if (firstPageLimitOrders.length >= totalExpectedLimitOrders) {
            setAdditionalLimitOrders([])
            return
          }
        } catch (error) {
          // If optimization fails, continue with regular approach
          logger.error(error, {
            tags: { file: 'AssetActivityProvider', function: 'fetchAdditionalLimitOrders' },
            extra: { message: 'Failed to fetch all open orders for optimization, falling back to pagination' },
          })
          totalExpectedLimitOrders = undefined
        }
      }

      // Fetch pages sequentially until we find no more activities or hit the limit
      while (hasMore && page <= PAGE_NUMBER_LIMIT) {
        const result = await lazyFetch({
          variables: {
            ...baseVariables,
            page,
          },
        })

        const activities = result.data?.portfolios?.[0]?.assetActivities || []

        // Filter for only open limit orders from this page and add to accumulator
        const limitOrders = activities.filter((activity): activity is AssetActivityItem => isOpenLimitOrder(activity))

        if (limitOrders.length > 0) {
          additionalOpenLimitOrders = [...additionalOpenLimitOrders, ...limitOrders]
        }

        // check if we've found all expected orders
        if (
          totalExpectedLimitOrders !== undefined &&
          additionalOpenLimitOrders.length + firstPageLimitOrders.length >= totalExpectedLimitOrders
        ) {
          break
        }

        hasMore = activities.length === PAGE_SIZE
        page++
      }

      setAdditionalLimitOrders(additionalOpenLimitOrders)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'AssetActivityProvider', function: 'fetchAdditionalLimitOrders' },
        extra: { message: 'Failed to fetch additional limit orders' },
      })
      // Set whatever we managed to fetch before the error
      setAdditionalLimitOrders(additionalOpenLimitOrders)
    } finally {
      setIsLoadingAdditional(false)
    }
  }, [account.address, baseVariables, lazyFetch, query.data])

  const fetch = useEvent(() => {
    lazyFetch({
      variables: baseVariables,
    }).then(() => {
      void fetchAdditionalOpenLimitOrders()
    })
  })

  useInterval(async () => {
    if (
      Object.values(fiatOnRampTransactions).some(
        (transaction) => !transaction.syncedWithBackend && transaction.forceFetched,
      )
    ) {
      fetch()
    }
  }, ms('15s'))

  // Merge the main query with additional limit orders
  const mergedQuery = useMemo(() => {
    if (!query.data?.portfolios?.[0]) {
      return query
    }

    // If no additional orders, return original query
    if (additionalLimitOrders.length === 0 && !isLoadingAdditional) {
      return query
    }

    const mainActivities = query.data.portfolios[0].assetActivities || []
    const mergedActivities = [...mainActivities, ...additionalLimitOrders]

    return {
      ...query,
      data: {
        ...query.data,
        portfolios: [
          {
            ...query.data.portfolios[0],
            assetActivities: mergedActivities,
          },
        ],
      },
      loading: query.loading || isLoadingAdditional,
    }
  }, [query, additionalLimitOrders, isLoadingAdditional])

  return (
    <AdaptiveAssetActivityProvider
      query={mergedQuery}
      fetch={fetch}
      stale={account.address !== previousAccount || isTestnetModeEnabled !== previousIsTestnetModeEnabled}
    >
      {children}
    </AdaptiveAssetActivityProvider>
  )
}

export function AssetActivityProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setInitialized(true)
  }, [])

  if (!initialized) {
    return children // Immediately render children first without provider overhead.
  }
  return <AssetActivityProviderInternal>{children}</AssetActivityProviderInternal>
}

export function useAssetActivity() {
  const query = useAssetActivityQuery()
  const { loading, data } = query
  const fetchedActivities = data?.portfolios?.[0]?.assetActivities

  const activities = useMemo(() => {
    if (!fetchedActivities) {
      return []
    }
    return fetchedActivities
  }, [fetchedActivities])

  return { activities, loading }
}
