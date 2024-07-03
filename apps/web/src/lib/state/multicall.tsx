import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useInterfaceMulticall, useMainnetInterfaceMulticall } from 'hooks/useContract'
import useBlockNumber, { useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

const multicall = createMulticall()

export default multicall

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 }

export function MulticallUpdater() {
  const { chainId } = useAccount()
  const supportedChain = useSupportedChainId(chainId)
  const latestBlockNumber = useBlockNumber()
  const contract = useInterfaceMulticall()
  const listenerOptions: ListenerOptions = useMemo(
    () => ({ blocksPerFetch: supportedChain ? UNIVERSE_CHAIN_INFO[supportedChain].blockPerMainnetEpochForChainId : 1 }),
    [supportedChain],
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
