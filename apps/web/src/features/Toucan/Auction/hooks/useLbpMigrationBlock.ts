import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useReadContract } from 'wagmi'
import { assume0xAddress } from '~/utils/wagmi'

const LBP_MIGRATION_BLOCK_ABI = [
  {
    inputs: [],
    name: 'migrationBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const MIGRATION_BLOCK_REFETCH_INTERVAL_MS = 12 * ONE_SECOND_MS

interface UseLbpMigrationBlockParams {
  chainId: EVMUniverseChainId | undefined
  enabled: boolean
  lbpStrategyAddress: string | undefined
}

interface UseLbpMigrationBlockResult {
  migrationBlock: bigint | undefined
  isLoading: boolean
  isError: boolean
}

export function useLbpMigrationBlock({
  chainId,
  enabled,
  lbpStrategyAddress,
}: UseLbpMigrationBlockParams): UseLbpMigrationBlockResult {
  const queryEnabled = enabled && Boolean(chainId && lbpStrategyAddress)
  const { data, isLoading, isError } = useReadContract({
    address: assume0xAddress(lbpStrategyAddress),
    chainId,
    abi: LBP_MIGRATION_BLOCK_ABI,
    functionName: 'migrationBlock',
    query: {
      enabled: queryEnabled,
      refetchInterval: queryEnabled ? MIGRATION_BLOCK_REFETCH_INTERVAL_MS : false,
    },
  })

  return { migrationBlock: data, isLoading, isError }
}
