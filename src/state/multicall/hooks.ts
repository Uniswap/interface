import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useBlockNumber from 'lib/hooks/useBlockNumber'

import { SkipFirst } from '../../types/tuple'
import { multicall } from './instance'
export type { CallStateResult } from '@uniswap/redux-multicall' // re-export for convenience
export { NEVER_RELOAD } from '@uniswap/redux-multicall' // re-export for convenience

const {
  useMultipleContractSingleData: _useMultipleContractSingleData,
  useSingleCallResult: _useSingleCallResult,
  useSingleContractMultipleData: _useSingleContractMultipleData,
  useSingleContractWithCallData: _useSingleContractWithCallData,
} = multicall.hooks

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useMultipleContractSingleData(...args: SkipFirstTwoParams<typeof _useMultipleContractSingleData>) {
  const { chainId, latestBlock } = useCallContext()
  return _useMultipleContractSingleData(chainId, latestBlock, ...args)
}

export function useSingleCallResult(...args: SkipFirstTwoParams<typeof _useSingleCallResult>) {
  const { chainId, latestBlock } = useCallContext()
  return _useSingleCallResult(chainId, latestBlock, ...args)
}

export function useSingleContractMultipleData(...args: SkipFirstTwoParams<typeof _useSingleContractMultipleData>) {
  const { chainId, latestBlock } = useCallContext()
  return _useSingleContractMultipleData(chainId, latestBlock, ...args)
}

export function useSingleContractWithCallData(...args: SkipFirstTwoParams<typeof _useSingleContractWithCallData>) {
  const { chainId, latestBlock } = useCallContext()
  return _useSingleContractWithCallData(chainId, latestBlock, ...args)
}

function useCallContext() {
  const { chainId } = useActiveWeb3React()
  const latestBlock = useBlockNumber()
  return { chainId, latestBlock }
}
