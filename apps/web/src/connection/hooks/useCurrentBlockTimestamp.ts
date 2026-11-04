import { MULTICALL_ADDRESSES } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import ms from 'ms'
import { useReadContract } from 'wagmi'
import { assume0xAddress } from '~/chains'
import { useAccount } from '~/connection/hooks/useAccount'

interface UseCurrentBlockTimestampParams {
  refetchInterval?: number | false
  chainId?: UniverseChainId
}

export interface CurrentBlockTimestampResult {
  blockTimestamp: bigint | undefined
  blockTimestampUpdatedAt: number
}

/**
 * Gets the current block timestamp from the blockchain
 * @param refetchInterval - The interval to refetch the block timestamp (defaults to 3 minutes)
 * @returns The current block timestamp and the time it was last fetched
 */
export function useCurrentBlockTimestamp({
  refetchInterval = ms('3min'),
  chainId,
}: UseCurrentBlockTimestampParams = {}): CurrentBlockTimestampResult {
  const account = useAccount()
  const resolvedChainId = chainId ?? account.chainId ?? UniverseChainId.Mainnet

  const result = useReadContract({
    address: assume0xAddress(MULTICALL_ADDRESSES[resolvedChainId]),
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

  return {
    blockTimestamp: result.data,
    blockTimestampUpdatedAt: result.dataUpdatedAt,
  }
}
