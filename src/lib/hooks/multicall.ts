import { multicall } from 'lib/state/web3'

export const {
  useMultipleContractSingleData,
  useSingleContractMultipleData,
  useSingleContractWithCallData,
  useSingleCallResult,
} = multicall.hooks
