import { ApolloClient, from, NormalizedCacheObject } from '@apollo/client'
import { MMKVWrapper } from 'apollo3-cache-persist'
import { useEffect } from 'react'
import { MMKV } from 'react-native-mmkv'
import { initAndPersistCache } from 'src/data/cache'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { getErrorLink, getHttpLink, getPerformanceLink } from 'wallet/src/data/links'
import { isNonJestDev } from 'wallet/src/utils/environment'
import { useAsyncData } from 'wallet/src/utils/hooks'

const mmkv = new MMKV()
if (isNonJestDev()) {
  // requires Flipper plugin `react-native-mmkv` to be installed
  require('react-native-mmkv-flipper-plugin').initializeMMKVFlipper({ default: mmkv })
}

// ONLY for use once in App.tsx! If you add this in other places you will go to JAIL!
export const usePersistedApolloClient = (): ApolloClient<NormalizedCacheObject> | undefined => {
  const { data: client } = useAsyncData(async function init(): Promise<
    ApolloClient<NormalizedCacheObject>
  > {
    const storage = new MMKVWrapper(mmkv)
    const cache = await initAndPersistCache(storage)

    return new ApolloClient({
      link: from([
        getErrorLink(),
        // requires typing outside of wallet package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPerformanceLink((args: any) =>
          sendAnalyticsEvent(MobileEventName.PerformanceGraphql, args)
        ),
        getHttpLink(),
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
  })

  useEffect(() => {
    if (isNonJestDev()) {
      // requires Flipper plugin `react-native-apollo-devtools` to be installed
      require('react-native-apollo-devtools-client').apolloDevToolsInit(client)
    }
  }, [client])

  return client
}
