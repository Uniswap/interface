import { createAdaptiveRefetchContext } from 'appGraphql/data/apollo/AdaptiveRefetch'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import ms from 'ms'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import {
  ActivityWebQueryResult,
  useActivityWebLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'

const { Provider: AdaptiveAssetActivityProvider, useQuery: useAssetActivityQuery } =
  createAdaptiveRefetchContext<ActivityWebQueryResult>()

function AssetActivityProviderInternal({ children }: PropsWithChildren) {
  const account = useAccount()
  const previousAccount = usePrevious(account.address)
  const { isTestnetModeEnabled, gqlChains } = useEnabledChains()
  const previousIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  const fiatOnRampTransactions = useFiatOnRampTransactions()

  const [lazyFetch, query] = useActivityWebLazyQuery()
  const transactionIds = useMemo(
    () => Object.values(fiatOnRampTransactions).map((tx) => tx.externalSessionId),
    [fiatOnRampTransactions],
  )

  const variables = useMemo(
    () => ({
      account: account.address ?? '',
      chains: gqlChains,
      // Backend will return off-chain activities even if gqlChains are all testnets.
      includeOffChain: !isTestnetModeEnabled,
      // Include the externalsessionIDs of all fiat on-ramp transactions in the local store,
      // so that the backend can find the transactions without signature authentication.
      onRampTransactionIDs: transactionIds,
    }),
    [account.address, gqlChains, isTestnetModeEnabled, transactionIds],
  )

  const fetch = useEvent(() => lazyFetch({ variables }))

  useInterval(async () => {
    if (
      Object.values(fiatOnRampTransactions).some(
        (transaction) => !transaction.syncedWithBackend && transaction.forceFetched,
      )
    ) {
      fetch()
    }
  }, ms('15s'))

  return (
    <AdaptiveAssetActivityProvider
      query={query}
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
