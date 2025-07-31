import { useMemo } from 'react'
import { useEnabledChainsWithConnector } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import {
  Connector,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useAccount as useAccountWagmi,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useChainId,
  type Register,
  type UseAccountReturnType as UseAccountReturnTypeWagmi,
} from 'wagmi'

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
  : T extends { chainId: number | undefined }
    ? Omit<T, 'chainId'> & { chainId: EVMUniverseChainId | undefined }
    : T

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi<Register['config']>>

function useSupportedChainIdWithConnector(
  chainId?: number | EVMUniverseChainId,
  connector?: Connector,
): EVMUniverseChainId | undefined {
  const { chains } = useEnabledChainsWithConnector(connector)
  return chains.includes(chainId as EVMUniverseChainId) ? (chainId as EVMUniverseChainId) : undefined
}

export function useAccount(): UseAccountReturnType {
  const { chainId, ...rest } = useAccountWagmi()
  const fallbackChainId = useChainId()
  const supportedChainId = useSupportedChainIdWithConnector(chainId ?? fallbackChainId, rest.connector)

  return useMemo(
    () => ({
      ...rest,
      chainId: supportedChainId,
    }),
    [rest, supportedChainId],
  )
}
