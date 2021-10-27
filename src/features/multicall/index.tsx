import { createMulticall } from 'multicall-query'
import React from 'react'
import { SupportedChainId } from 'src/constants/chains'
import { useLatestBlock } from 'src/features/blocks/hooks'
import { useMulticall2Contract } from 'src/features/contracts/useContract'
import { SkipFirst } from 'src/utils/tuple'

// Create a multicall instance with default settings
export const multicall = createMulticall()

const {
  useMultipleContractSingleData: _useMultipleContractSingleData,
  useSingleCallResult: _useSingleCallResult,
  useSingleContractMultipleData: _useSingleContractMultipleData,
  useSingleContractWithCallData: _useSingleContractWithCallData,
} = multicall.hooks

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useMultipleContractSingleData(
  chainId: SupportedChainId,
  ...args: SkipFirstTwoParams<typeof _useMultipleContractSingleData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useMultipleContractSingleData(chainId, latestBlock, ...args)
}

export function useSingleCallResult(
  chainId: SupportedChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleCallResult>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleCallResult(chainId, latestBlock, ...args)
}

export function useSingleContractMultipleData(
  chainId: SupportedChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleContractMultipleData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleContractMultipleData(chainId, latestBlock, ...args)
}

export function useSingleContractWithCallData(
  chainId: SupportedChainId,
  ...args: SkipFirstTwoParams<typeof _useSingleContractWithCallData>
) {
  const latestBlock = useLatestBlock(chainId)
  return _useSingleContractWithCallData(chainId, latestBlock, ...args)
}

// Create Updater wrapper that pulls needed info from store
export function MulticallUpdater() {
  const Updater = multicall.Updater
  const contract = useMulticall2Contract(SupportedChainId.GOERLI)
  const latestBlock = useLatestBlock(SupportedChainId.GOERLI)
  return (
    <Updater
      chainId={SupportedChainId.GOERLI}
      latestBlockNumber={latestBlock}
      contract={contract}
    />
  )
}
