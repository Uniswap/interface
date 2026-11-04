import { EVMUniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import {
  type Register,
  type UseAccountReturnType as UseAccountReturnTypeWagmi,
  // oxlint-disable-next-line no-restricted-imports -- wagmi account hook needed for wallet integration
  useAccount as useAccountWagmi,
  // oxlint-disable-next-line no-restricted-imports -- wagmi chain hook needed for chain management
  useChainId,
} from 'wagmi'

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
  : T extends { chainId: number | undefined }
    ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
    : T

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi<Register['config']>>

/**
 * @deprecated use new Account hooks from apps/web/src/connection/accounts/hooks.ts instead
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
