import { useMemo } from 'react'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import {
  type Register,
  type UseAccountReturnType as UseAccountReturnTypeWagmi,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useAccount as useAccountWagmi,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useChainId,
} from 'wagmi'

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
  : T extends { chainId: number | undefined }
    ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
    : T

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi<Register['config']>>

export function useAccount(): UseAccountReturnType {
  const { chainId, ...rest } = useAccountWagmi()
  const fallbackChainId = useChainId()
  const supportedChainId = useSupportedChainId(chainId ?? fallbackChainId) as EVMUniverseChainId | undefined

  return useMemo(
    () => ({
      ...rest,
      chainId: supportedChainId,
    }),
    [rest, supportedChainId],
  )
}
