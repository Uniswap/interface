import { MULTICALL_ADDRESSES } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract, useChainId as useWagmiChainId, useBlock, useBlockNumber } from 'wagmi'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'
import { RPCType } from 'uniswap/src/features/chains/types'

// Extended MULTICALL_ADDRESSES for chains not in @uniswap/sdk-core
// TODO: Replace with actual MULTICALL contract addresses for HashKey chains
const EXTENDED_MULTICALL_ADDRESSES: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.HashKeyTestnet]: '0xcA11bde05977b3631167028862bE2a173976CA11', // Standard MULTICALL3 address (common for EVM chains)
  [UniverseChainId.HashKey]: '0xcA11bde05977b3631167028862bE2a173976CA11', // Standard MULTICALL3 address (common for EVM chains)
}

/**
 * Gets the MULTICALL address for a given chainId
 */
function getMulticallAddress(chainId: UniverseChainId | undefined): string | undefined {
  if (!chainId) {
    return MULTICALL_ADDRESSES[UniverseChainId.Mainnet]
  }

  // First check extended addresses for custom chains
  if (chainId in EXTENDED_MULTICALL_ADDRESSES) {
    return EXTENDED_MULTICALL_ADDRESSES[chainId as keyof typeof EXTENDED_MULTICALL_ADDRESSES]
  }

  // Then check standard MULTICALL_ADDRESSES
  return MULTICALL_ADDRESSES[chainId] ?? MULTICALL_ADDRESSES[UniverseChainId.Mainnet]
}

/**
 * Gets the current block timestamp from the blockchain
 * @param refetchInterval - The interval to refetch the block timestamp (defaults to 3 minutes)
 * @returns The current block timestamp
 */
export default function useCurrentBlockTimestamp({
  refetchInterval = ms('3min'),
}: {
  refetchInterval?: number | false
} = {}): bigint | undefined {
  const account = useAccount()
  const wagmiChainId = useWagmiChainId() // Get raw chainId from wagmi
  const chainId = account.chainId ?? wagmiChainId ?? UniverseChainId.Mainnet
  const multicallAddress = getMulticallAddress(chainId)

  

  if (!multicallAddress) {
    return undefined
  }

  const result = useReadContract({
    address: assume0xAddress(multicallAddress),
    abi: [
      {
        inputs: [],
        name: 'getCurrentBlockTimestamp',
        outputs: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getCurrentBlockTimestamp',
    query: { refetchInterval },
  })

  // Fallback to useBlock if Multicall fails or returns no data
  // Try to get blockNumber first, but if that fails, useBlock can still work without blockNumber (gets latest block)
  const blockNumberQuery = useBlockNumber({ chainId })
  const blockNumber = blockNumberQuery.data
  const shouldUseFallback = result.isError || !result.data
  const blockData = useBlock({
    chainId,
    blockNumber: blockNumber, // If undefined, useBlock will get the latest block
    query: {
      enabled: shouldUseFallback,
    },
  })

  // Use Multicall result if available, otherwise fallback to useBlock
  const blockTimestamp = result.data ?? (blockData.data?.timestamp ? BigInt(blockData.data.timestamp) : undefined)

  return blockTimestamp
}
