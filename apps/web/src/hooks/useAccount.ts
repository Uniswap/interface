import { useMemo } from 'react'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import {
  type Register,
  type UseAccountReturnType as UseAccountReturnTypeWagmi,
  // biome-ignore lint/style/noRestrictedImports: wagmi account hook needed for wallet integration
  useAccount as useAccountWagmi,
  // biome-ignore lint/style/noRestrictedImports: wagmi chain hook needed for chain management
  useChainId,
} from 'wagmi'

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
  : T extends { chainId: number | undefined }
    ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
    : T

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi<Register['config']>>

/**
 * @deprecated use new Account hooks from apps/web/src/features/accounts/store/hooks.ts instead
 */
export function useAccount(): UseAccountReturnType {
  const wagmiAccount = useAccountWagmi()

  const fallbackChainId = useChainId()
  const supportedChainId = useSupportedChainId(wagmiAccount.chainId ?? fallbackChainId) as
    | EVMUniverseChainId
    | undefined

  return useMemo(
    () => ({
      ...wagmiAccount,
      chainId: supportedChainId,
    }),
    [wagmiAccount, supportedChainId],
  )
}
