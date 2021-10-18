import { createMulticall } from 'multicall-query'
import React from 'react'
import { SupportedChainId } from 'src/constants/chains'
import { useLatestBlock } from 'src/features/blocks/hooks'
import { useMulticall2Contract } from 'src/features/contracts/useContract'

// Create a multicall instance with default settings
export const multicall = createMulticall()

// Re-export hooks for convenience
export const {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
  useSingleContractWithCallData,
} = multicall.hooks

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
