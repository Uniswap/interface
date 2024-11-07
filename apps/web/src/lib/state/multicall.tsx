import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { useAccount } from 'hooks/useAccount'
import { useInterfaceMulticall, useMainnetInterfaceMulticall } from 'hooks/useContract'
import { useAtomValue } from 'jotai/utils'
import useBlockNumber, { multicallUpdaterSwapChainIdAtom, useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const multicall = createMulticall()

export default multicall

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 }

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

  const latestMainnetBlockNumber = useMainnetBlockNumber()
  const mainnetContract = useMainnetInterfaceMulticall()

  return (
    <>
      <multicall.Updater
        chainId={UniverseChainId.Mainnet}
        latestBlockNumber={latestMainnetBlockNumber}
        contract={mainnetContract}
        listenerOptions={MAINNET_LISTENER_OPTIONS}
      />
      {chainId !== UniverseChainId.Mainnet && (
        <multicall.Updater
          chainId={chainId}
          latestBlockNumber={latestBlockNumber}
          contract={contract}
          listenerOptions={listenerOptions}
        />
      )}
    </>
  )
}
