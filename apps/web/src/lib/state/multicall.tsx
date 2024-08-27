import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { useAccount } from 'hooks/useAccount'
import { useInterfaceMulticall, useMainnetInterfaceMulticall } from 'hooks/useContract'
import { useAtomValue } from 'jotai/utils'
import useBlockNumber, { multicallUpdaterSwapChainIdAtom, useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

const multicall = createMulticall()

export default multicall

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 }

export function MulticallUpdater() {
  const account = useAccount()
  const multichainFlagEnabled = useFeatureFlag(FeatureFlags.MultichainUX)
  const multicallUpdaterSwapChainId = useAtomValue(multicallUpdaterSwapChainIdAtom)
  const chainId = multichainFlagEnabled ? multicallUpdaterSwapChainId ?? account.chainId : account.chainId
  const latestBlockNumber = useBlockNumber()
  const contract = useInterfaceMulticall(chainId)
  const listenerOptions: ListenerOptions = useMemo(
    () => ({ blocksPerFetch: chainId ? UNIVERSE_CHAIN_INFO[chainId].blockPerMainnetEpochForChainId : 1 }),
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
