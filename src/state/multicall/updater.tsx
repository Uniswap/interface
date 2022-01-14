import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import multicall from 'lib/state/multicall'

import { useInterfaceMulticall } from '../../hooks/useContract'

// Create Updater wrappers that pull needed info from store
export default function Updater() {
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const multicall2Contract = useInterfaceMulticall()
  return <multicall.Updater chainId={chainId} latestBlockNumber={latestBlockNumber} contract={multicall2Contract} />
}
