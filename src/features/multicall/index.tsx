import { createMulticall } from '@uniswap/redux-multicall'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import { useLatestBlock } from 'src/features/blocks/hooks'
import { useActiveChainIds } from 'src/features/chains/hooks'
import { useMulticall2Contract } from 'src/features/contracts/useContract'
import { SkipFirst } from 'src/utils/tuple'

// Create a multicall instance with default settings
export const multicall = createMulticall()
const Updater = multicall.Updater

const {
  useMultipleContractSingleData: _useMultipleContractSingleData,
  useSingleCallResult: _useSingleCallResult,
  useSingleContractMultipleData: _useSingleContractMultipleData,
  useSingleContractWithCallData: _useSingleContractWithCallData,
} = multicall.hooks

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useMultipleContractSingleData(
  chainId: ChainId,
  ...args: SkipFirstTwoParams<typeof _useMultipleContractSingleData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useMultipleContractSingleData(chainId, latestBlock, ...args)
}

export function useSingleCallResult(
  chainId: ChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleCallResult>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleCallResult(chainId, latestBlock, ...args)
}

export function useSingleContractMultipleData(
  chainId: ChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleContractMultipleData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleContractMultipleData(chainId, latestBlock, ...args)
}

export function useSingleContractWithCallData(
  chainId: ChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleContractWithCallData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleContractWithCallData(chainId, latestBlock, ...args)
}

export function MulticallUpdaters() {
  const activeChains = useActiveChainIds()
  return (
    <>
      {activeChains.map((chainId) => (
        <SingleChainUpdater chainId={chainId} key={chainId} />
      ))}
    </>
  )
}

// Create Updater wrappers that pull needed info from store
function SingleChainUpdater({ chainId }: { chainId: ChainId }) {
  const contract = useMulticall2Contract(chainId)
  const latestBlock = useLatestBlock(chainId)
  return <Updater chainId={chainId} latestBlockNumber={latestBlock} contract={contract} />
}
