import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult, queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function mnemonicUnlockedQuery(
  mnemonicId: string,
): QueryOptionsResult<string, Error, string, [ReactQueryCacheKey.MnemonicUnlocked, string]> {
  return queryWithoutCache({
    queryKey: [ReactQueryCacheKey.MnemonicUnlocked, mnemonicId],
    queryFn: () => Keyring.retrieveMnemonicUnlocked(mnemonicId),
  })
}
