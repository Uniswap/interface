import { multicall } from 'lib/state'

export const {
  useMultipleContractSingleData,
  useSingleContractMultipleData,
  useSingleContractWithCallData,
  useSingleCallResult,
} = multicall.hooks
