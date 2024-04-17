import { SubscriptionResult } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { PropsWithChildren, createContext, useContext, useMemo, useReducer } from 'react'
import {
  Exact,
  OnAssetActivitySubscription,
  useOnAssetActivitySubscription,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/statsig/flags'
import { useFeatureFlag } from 'uniswap/src/features/statsig/hooks'
import { v4 as uuidV4 } from 'uuid'

const SubscriptionContext = createContext<
  SubscriptionResult<OnAssetActivitySubscription, Exact<{ account: string; subscriptionId: string }>> | undefined
>(undefined)

export function AssetActivityProvider({ children }: PropsWithChildren) {
  const { account } = useWeb3React()
  const isRealtimeEnabled = useFeatureFlag(FeatureFlags.Realtime)
  const [attempt, incrementAttempt] = useReducer((attempt) => attempt + 1, 1)
  const subscriptionId = useMemo(uuidV4, [account, attempt])
  const result = useOnAssetActivitySubscription({
    variables: { account: account ?? '', subscriptionId },
    skip: !account || !isRealtimeEnabled,
    onError: (error) => {
      console.error(error)
      incrementAttempt()
    },
  })

  return <SubscriptionContext.Provider value={result}>{children}</SubscriptionContext.Provider>
}

export function useAssetActivitySubscription() {
  const value = useContext(SubscriptionContext)
  if (!value) {
    throw new Error('useAssetActivitySubscription must be used within an AssetActivityProvider')
  }
  return value
}
