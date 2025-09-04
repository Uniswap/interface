import { PartialMessage } from '@bufbuild/protobuf'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { FiatOnRampParams } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { createOnRampTransactionsAuth, ON_RAMP_AUTH_MAX_LIMIT } from 'wallet/src/data/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

type OnRampAuthQueryOptions = QueryOptionsResult<
  PartialMessage<FiatOnRampParams> | undefined,
  Error,
  PartialMessage<FiatOnRampParams> | undefined,
  [ReactQueryCacheKey.OnRampAuth, Address]
>

function createOnRampAuthQueryOptions({
  address,
  account,
  signerManager,
  needsOnRampAuth,
}: {
  address: Address
  account: Account | undefined
  signerManager: SignerManager
  needsOnRampAuth: boolean
}): OnRampAuthQueryOptions {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.OnRampAuth, address],
    queryFn: async (): Promise<PartialMessage<FiatOnRampParams> | undefined> => {
      if (!account) {
        return undefined
      }
      try {
        const auth = await createOnRampTransactionsAuth({
          limit: ON_RAMP_AUTH_MAX_LIMIT,
          account,
          signerManager,
        })
        return { params: { case: 'auth', value: auth } }
      } catch (error) {
        logger.error(error, {
          tags: {
            file: 'useRestOnRampAuth',
            function: 'createOnRampAuthQueryOptions',
          },
        })
        return undefined
      }
    },
    enabled: needsOnRampAuth && !!account,
  })
}

/**
 * Create auth parameters used when fetching transactions in order to include FOR purchases
 * @param address - wallet address
 * @returns Authentication parameters for fetching FOR transactions
 */
export function useRestOnRampAuth(address: Address): PartialMessage<FiatOnRampParams> | undefined {
  const accounts = useAccounts()
  const account = accounts[address]
  const needsOnRampAuth = account?.type === AccountType.SignerMnemonic
  const signerManager = useWalletSigners()

  const { data } = useQuery(createOnRampAuthQueryOptions({ address, account, signerManager, needsOnRampAuth }))

  return needsOnRampAuth ? data : undefined
}
