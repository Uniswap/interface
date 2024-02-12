import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useBlockNumber, { useMainnetBlockNumber } from 'lib/hooks/useBlockNumber'
import multicall from 'lib/state/multicall'
import { SkipFirst } from 'types/tuple'

export { NEVER_RELOAD } from '@uniswap/redux-multicall' // re-export for convenience
export type { CallStateResult } from '@uniswap/redux-multicall' // re-export for convenience

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useMultipleContractSingleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useMultipleContractSingleData>
) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useMultipleContractSingleData(chainId, latestBlock, ...args)
}

export function useSingleCallResult(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useSingleCallResult(chainId, latestBlock, ...args)
}

export function useMainnetSingleCallResult(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>) {
  const latestMainnetBlock = useMainnetBlockNumber()
  return multicall.hooks.useSingleCallResult(ChainId.MAINNET, latestMainnetBlock, ...args)
}

export function useSingleContractMultipleData(
  ...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractMultipleData>
) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useSingleContractMultipleData(chainId, latestBlock, ...args)
}

function useCallContext() {
  const { chainId } = useWeb3React()
  const latestBlock = useBlockNumber()
  return { chainId, latestBlock }
}
