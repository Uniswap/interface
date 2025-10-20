import { createAdaptiveRefetchContext } from 'appGraphql/data/apollo/AdaptiveRefetch'
import { GraphQLApi } from '@universe/api'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import ms from 'ms'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'

const { Provider: AdaptiveAssetActivityProvider } = createAdaptiveRefetchContext<GraphQLApi.ActivityWebQueryResult>()

const PAGE_SIZE = 100
const INITIAL_PAGE = 1

function AssetActivityProviderInternal({ children }: PropsWithChildren) {
  const account = useAccount()
  const previousAccount = usePrevious(account.address)
  const { isTestnetModeEnabled, gqlChains } = useEnabledChains()
  const previousIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  const fiatOnRampTransactions = useFiatOnRampTransactions()

  const [lazyFetch, query] = GraphQLApi.useActivityWebLazyQuery()

  const transactionIds = useMemo(
    () => Object.values(fiatOnRampTransactions).map((tx) => tx.externalSessionId),
    [fiatOnRampTransactions],
  )

  const baseVariables = useMemo<GraphQLApi.ActivityWebQueryVariables>(
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

  const fetch = useEvent(() => {
    lazyFetch({
      variables: baseVariables,
    }).catch((error) => {
      logger.error(error, {
        tags: {
          file: 'AssetActivityProvider.tsx',
          function: 'fetch',
        },
      })
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
