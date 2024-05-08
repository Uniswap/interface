import { createMulticall, ListenerOptions } from '@uniswap/redux-multicall'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getBlocksPerMainnetEpochForChainId } from 'constants/chainInfo'
import { useInterfaceMulticall, useMainnetInterfaceMulticall } from 'hooks/useContract'
import useBlockNumber, { useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import { useMemo } from 'react'

const multicall = createMulticall()

export default multicall

const MAINNET_LISTENER_OPTIONS = { blocksPerFetch: 1 }

export function MulticallUpdater() {
  const { chainId } = useWeb3React()
  const latestBlockNumber = useBlockNumber()
  const contract = useInterfaceMulticall()
  const listenerOptions: ListenerOptions = useMemo(
    () => ({ blocksPerFetch: getBlocksPerMainnetEpochForChainId(chainId) }),
    [chainId]
  )

  const latestMainnetBlockNumber = useMainnetBlockNumber()
  const mainnetContract = useMainnetInterfaceMulticall()

  return (
    <>
      <multicall.Updater
        chainId={ChainId.MAINNET}
        latestBlockNumber={latestMainnetBlockNumber}
        contract={mainnetContract}
        listenerOptions={MAINNET_LISTENER_OPTIONS}
      />
      {chainId !== ChainId.MAINNET && (
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
