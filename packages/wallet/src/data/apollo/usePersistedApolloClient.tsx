import { ApolloClient, from, NormalizedCacheObject } from '@apollo/client'
import { PersistentStorage } from 'apollo3-cache-persist/lib/types'
import { useCallback, useEffect, useState } from 'react'
import { MMKV } from 'react-native-mmkv'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isNonJestDev } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { useAsyncData } from 'utilities/src/react/hooks'
import { initAndPersistCache } from 'wallet/src/data/apollo/cache'
import {
  CustomEndpoint,
  getCustomGraphqlHttpLink,
  getErrorLink,
  getGraphqlHttpLink,
  getPerformanceLink,
  getRestLink,
} from 'wallet/src/data/links'

type ApolloClientRef = {
  current: ApolloClient<NormalizedCacheObject> | null
  onReady: () => Promise<ApolloClient<NormalizedCacheObject>>
}

// This object allows us to get access to the apollo client in places outside of React where we can't use hooks.
export const apolloClientRef: ApolloClientRef = ((): ApolloClientRef => {
  let apolloClient: ApolloClient<NormalizedCacheObject> | null = null

  const listeners: Array<
    (value: ApolloClient<NormalizedCacheObject> | PromiseLike<ApolloClient<NormalizedCacheObject>>) => void
  > = []

  const ref: ApolloClientRef = {
    get current() {
      return apolloClient
    },

    set current(newApolloClient) {
      if (!newApolloClient) {
        throw new Error("Can't set `apolloClient` to `null`")
      }

      apolloClient = newApolloClient
      listeners.forEach((resolve) => resolve(newApolloClient))
    },

    onReady: async (): Promise<ApolloClient<NormalizedCacheObject>> => {
      if (apolloClient) {
        return Promise.resolve(apolloClient)
      }

      return new Promise<ApolloClient<NormalizedCacheObject>>((resolve) => listeners.push(resolve))
    },
  }

  return ref
})()

const mmkv = new MMKV()
if (isNonJestDev && isMobileApp) {
  // requires Flipper plugin `react-native-mmkv` to be installed
  require('react-native-mmkv-flipper-plugin').initializeMMKVFlipper({ default: mmkv })
}

// ONLY for use once in App.tsx! If you add this in other places you will go to JAIL!
export const usePersistedApolloClient = ({
  storageWrapper,
  maxCacheSizeInBytes,
  customEndpoint,
}: {
  storageWrapper: PersistentStorage<string>
  maxCacheSizeInBytes: number
  customEndpoint?: CustomEndpoint
}): ApolloClient<NormalizedCacheObject> | undefined => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()

  const apolloLink = customEndpoint ? getCustomGraphqlHttpLink(customEndpoint) : getGraphqlHttpLink()

  const init = useCallback(async () => {
    const cache = await initAndPersistCache({ storage: storageWrapper, maxCacheSizeInBytes })

    if (customEndpoint) {
      logger.debug(
        'usePersistedApolloClient',
        'usePersistedApolloClient',
        `Using custom endpoint ${customEndpoint.url}`,
      )
    }

    const restLink = getRestLink()

    const newClient = new ApolloClient({
      assumeImmutableResults: true,
      link: from([
        getErrorLink(),
        // requires typing outside of wallet package
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPerformanceLink((args: any) => sendAnalyticsEvent(WalletEventName.PerformanceGraphql, args)),
        restLink,
        apolloLink,
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

    apolloClientRef.current = newClient
    setClient(newClient)

    // Ensure this callback only is computed once even if apolloLink changes,
    // otherwise this will cause a rendering loop re-initializing the client
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useAsyncData(init)

  useEffect(() => {
    if (isNonJestDev) {
      // requires Flipper plugin `react-native-apollo-devtools` to be installed
      require('react-native-apollo-devtools-client').apolloDevToolsInit(client)
    }
  }, [client])

  return client
}
