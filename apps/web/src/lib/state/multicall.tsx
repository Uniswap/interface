import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { useAccount } from 'hooks/useAccount'
import { useInterfaceMulticall } from 'hooks/useContract'
import { useAtomValue } from 'jotai/utils'
import useBlockNumber, { multicallUpdaterSwapChainIdAtom } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

const multicall = createMulticall()

export default multicall

export function MulticallUpdater() {
  const account = useAccount()
  const multicallUpdaterSwapChainId = useAtomValue(multicallUpdaterSwapChainIdAtom)
  const chainId = multicallUpdaterSwapChainId ?? account.chainId
  const latestBlockNumber = useBlockNumber()
  const contract = useInterfaceMulticall(chainId)
  const listenerOptions: ListenerOptions = useMemo(
    () => ({ blocksPerFetch: chainId ? getChainInfo(chainId).blockPerMainnetEpochForChainId : 1 }),
    [chainId],
  )

  return (
    <multicall.Updater
      chainId={chainId}
      latestBlockNumber={latestBlockNumber}
      contract={contract}
      listenerOptions={listenerOptions}
    />
  )
}
