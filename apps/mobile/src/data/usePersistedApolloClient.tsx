import { ApolloClient, from, NormalizedCacheObject } from '@apollo/client'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { useCallback, useEffect, useState } from 'react'
import { MMKV } from 'react-native-mmkv'
import { initAndPersistCache } from 'src/data/cache'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { isNonJestDev } from 'utilities/src/environment'
import { useAsyncData } from 'utilities/src/react/hooks'
import {
  getErrorLink,
  getGraphqlHttpLink,
  getPerformanceLink,
  getRestLink,
} from 'wallet/src/data/links'

export let apolloClient: ApolloClient<NormalizedCacheObject> | null = null

const mmkv = new MMKV()
if (isNonJestDev()) {
  // requires Flipper plugin `react-native-mmkv` to be installed
  require('react-native-mmkv-flipper-plugin').initializeMMKVFlipper({ default: mmkv })
}

// ONLY for use once in App.tsx! If you add this in other places you will go to JAIL!
export const usePersistedApolloClient = (): ApolloClient<NormalizedCacheObject> | undefined => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()

  const init = useCallback(async () => {
    const storage = new MMKVWrapper(mmkv)
    const cache = await initAndPersistCache(storage)

    const newClient = new ApolloClient({
      link: from([
        getErrorLink(),
        // requires typing outside of wallet package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPerformanceLink((args: any) =>
          sendMobileAnalyticsEvent(MobileEventName.PerformanceGraphql, args)
        ),
        getRestLink(),
        getGraphqlHttpLink(),
      ]),
      cache,
      defaultOptions: {
        watchQuery: {
          // NOTE: when polling is enabled, if there is cached data, the first request is skipped.
          // `cache-and-network` ensures we send a request on first query, keeping queries
          // across the app in sync.
          fetchPolicy: 'cache-and-network',
          // ensures query is returning data even if some fields errored out
          errorPolicy: 'all',
        },
      },
    })

    apolloClient = newClient
    setClient(newClient)
  }, [])

  useAsyncData(init)

  useEffect(() => {
    if (isNonJestDev()) {
      // requires Flipper plugin `react-native-apollo-devtools` to be installed
      require('react-native-apollo-devtools-client').apolloDevToolsInit(client)
    }
  }, [client])

  return client
}
