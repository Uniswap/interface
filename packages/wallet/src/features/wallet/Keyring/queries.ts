import { UseQueryOptions } from '@tanstack/react-query'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function mnemonicUnlockedQuery(mnemonicId: string): UseQueryOptions<string> {
  return queryWithoutCache({
    queryKey: [ReactQueryCacheKey.MnemonicUnlocked, mnemonicId],
    queryFn: () => Keyring.retrieveMnemonicUnlocked(mnemonicId),
  })
}
