import { ApolloProvider, SubscriptionResult } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { useIsRealtimeEnabled } from 'featureFlags/flags/realtime'
import { OnAssetActivitySubscription, useOnAssetActivitySubscription } from 'graphql/data/__generated__/types-and-hooks'
import { PropsWithChildren, createContext, useMemo, useReducer } from 'react'
import { v4 as uuidV4 } from 'uuid'
import { apolloClient } from './client'

const SubscriptionContext = createContext<SubscriptionResult<OnAssetActivitySubscription>>({ loading: true })

function AssetActivityProvider({ children }: PropsWithChildren) {
  const { account } = useWeb3React()
  const [attempt, incrementAttempt] = useReducer((attempt) => attempt + 1, 1)
  const subscriptionId = useMemo(uuidV4, [account, attempt])
  const result = useOnAssetActivitySubscription({
    variables: { account: account ?? '', subscriptionId },
    skip: !account,
    onError: (error) => {
      console.error(error)
      incrementAttempt()
    },
  })

  return <SubscriptionContext.Provider value={result}>{children}</SubscriptionContext.Provider>
}

export function Provider({ children }: PropsWithChildren) {
  const isRealtimeEnabled = useIsRealtimeEnabled()
  return (
    <ApolloProvider client={apolloClient}>
      {isRealtimeEnabled ? <AssetActivityProvider>{children}</AssetActivityProvider> : children}
    </ApolloProvider>
  )
}
