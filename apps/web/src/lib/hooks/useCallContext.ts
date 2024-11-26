import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'

export function useCallContext() {
  const { chainId } = useSwapAndLimitContext()
  const latestBlock = useBlockNumber()
  return { chainId, latestBlock }
}
