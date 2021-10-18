import { BigNumber } from 'ethers'
import { SupportedChainId } from 'src/constants/chains'
import { useLatestBlock } from 'src/features/blocks/hooks'
import { useMulticall2Contract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'

// Gets the current timestamp from the blockchain
export function useCurrentBlockTimestamp(chainId: SupportedChainId): BigNumber | undefined {
  const multicall = useMulticall2Contract(chainId)
  const latestBlock = useLatestBlock(chainId)
  const result = useSingleCallResult(
    chainId,
    latestBlock ?? 0,
    multicall,
    'getCurrentBlockTimestamp'
  )
  return result.result?.[0]
}
