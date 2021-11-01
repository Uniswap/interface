import { BigNumber } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { useMulticall2Contract } from 'src/features/contracts/useContract'
import { useSingleCallResult } from 'src/features/multicall'

// Gets the current timestamp from the blockchain
export function useCurrentBlockTimestamp(chainId: ChainId): BigNumber | undefined {
  const multicall = useMulticall2Contract(chainId)
  const result = useSingleCallResult(chainId, multicall, 'getCurrentBlockTimestamp')
  return result.result?.[0]
}
