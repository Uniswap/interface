import { MULTICALL_ADDRESSES } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

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

  return useReadContract({
    address: assume0xAddress(MULTICALL_ADDRESSES[account.chainId ?? UniverseChainId.Mainnet]),
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
  }).data
}
