import { ApolloClient, ApolloLink, from, NormalizedCacheObject } from '@apollo/client'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import { useMutation } from '@tanstack/react-query'
import { PersistentStorage } from 'apollo3-cache-persist/lib/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CustomEndpoint,
  getCustomGraphqlHttpLink,
  getErrorLink,
  getGraphqlHttpLink,
  getPerformanceLink,
  getRestLink,
} from 'uniswap/src/data/links'
import { getInstantTokenBalanceUpdateApolloLink } from 'uniswap/src/features/portfolio/portfolioUpdates/getInstantTokenBalanceUpdateApolloLink'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { initAndPersistCache } from 'wallet/src/data/apollo/cache'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

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

// ONLY for use once in App.tsx! If you add this in other places you will go to JAIL!
export const usePersistedApolloClient = ({
  storageWrapper,
  maxCacheSizeInBytes,
  customEndpoint,
  reduxStore,
}: {
  storageWrapper: PersistentStorage<string>
  maxCacheSizeInBytes: number
  customEndpoint?: CustomEndpoint
  reduxStore: ToolkitStore
}): ApolloClient<NormalizedCacheObject> | undefined => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()
  const signerManager = useWalletSigners()
  const accounts = useAccounts()
  const hasInitialized = useRef(false)
  const init = useMemo(
    () =>
      makeApolloClientInit({
        storageWrapper,
        maxCacheSizeInBytes,
        customEndpoint,
        reduxStore,
        accounts,
        signerManager,
      }),
    [storageWrapper, maxCacheSizeInBytes, customEndpoint, reduxStore, accounts, signerManager],
  )

  const mutation = useMutation({
    mutationFn: init,
    onSuccess: (newClient) => {
      setClient(newClient)
    },
    retry: false,
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'usePersistedApolloClient.ts',
          function: 'init',
        },
      })
    },
  })

  const mutate = useEvent(() => {
    // we only want to initialize the apollo client once per app load
    if (!hasInitialized.current) {
      hasInitialized.current = true
      mutation.mutate()
    }
  })

  useEffect(() => {
    mutate()
  }, [mutate])

  return client
}

function makeApolloClientInit(ctx: {
  storageWrapper: PersistentStorage<string>
  maxCacheSizeInBytes: number
  customEndpoint?: CustomEndpoint
  reduxStore: ToolkitStore
  accounts: ReturnType<typeof useAccounts>
  signerManager: ReturnType<typeof useWalletSigners>
}): () => Promise<ApolloClient<NormalizedCacheObject>> {
  const { storageWrapper, maxCacheSizeInBytes, customEndpoint, reduxStore } = ctx
  const apolloLink = customEndpoint ? getCustomGraphqlHttpLink(customEndpoint) : getGraphqlHttpLink()

  const init = async (): Promise<ApolloClient<NormalizedCacheObject>> => {
    const cache = await initAndPersistCache({ storage: storageWrapper, maxCacheSizeInBytes })

    if (customEndpoint) {
      logger.debug(
        'usePersistedApolloClient',
        'usePersistedApolloClient',
        `Using custom endpoint ${customEndpoint.url}`,
      )
    }

    const restLink = getRestLink()

    const linkList: ApolloLink[] = [
      getErrorLink(),
      // requires typing outside of wallet package
      // biome-ignore lint/suspicious/noExplicitAny: PerformanceLink args come from Apollo and require typing outside wallet package
      getPerformanceLink((args: any) => sendAnalyticsEvent(WalletEventName.PerformanceGraphql, args)),
      getInstantTokenBalanceUpdateApolloLink({ reduxStore }),
      restLink,
    ]
    if (isMobileApp) {
      linkList.push(getDatadogApolloLink())
    }

    const newClient = new ApolloClient({
      assumeImmutableResults: true,
      // our main ApolloLink must be last in the chain so that other links can modify the request
      link: from(linkList.concat(apolloLink)),
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

    return newClient
    // Ensure this callback only is computed once even if apolloLink changes,
    // otherwise this will cause a rendering loop re-initializing the client
  }
  return init
}
