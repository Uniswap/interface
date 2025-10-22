import { type ApolloClient, type NormalizedCacheObject, useApolloClient } from '@apollo/client'
import { createSignedRequestParams, type GraphQLApi, objectToQueryString } from '@universe/api'
import { useCallback } from 'react'
import { type Account } from 'wallet/src/features/wallet/accounts/types'
import { type SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

export const ON_RAMP_AUTH_MAX_LIMIT = 100
export const ON_RAMP_AUTH_MIN_LIMIT = 1

export function useRefetchQueries(): (
  include?: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include'],
) => void {
  const client = useApolloClient()

  return useCallback(
    async (include: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include'] = 'active') => {
      await client.refetchQueries({ include })
    },
    [client],
  )
}

export async function createOnRampTransactionsAuth({
  limit,
  account,
  signerManager,
}: {
  limit: number
  account: Account
  signerManager: SignerManager
}): Promise<GraphQLApi.OnRampTransactionsAuth> {
  const { requestParams, signature } = await createSignedRequestParams({
    data: { limit }, // Parameter needed by graphql server when fetching onramp transactions
    address: account.address,
    signMessage: generateSignerFunc(account, signerManager),
  })
  return { queryParams: objectToQueryString(requestParams), signature }
}
