import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useMultichainContext } from 'state/multichain/useMultichainContext'

export function useCallContext() {
  const { chainId } = useMultichainContext()
  const latestBlock = useBlockNumber()
  return { chainId, latestBlock }
}
