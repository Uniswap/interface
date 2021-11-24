import JSBI from 'jsbi'

import { useSingleCallResult } from '../state/multicall/hooks'
import { useContract } from './useContract'
import useENSAddress from './useENSAddress'

const CHAIN_DATA_ABI = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

/**
 * Returns the price of 1 gas in WEI for the currently selected network using the chainlink fast gas price oracle
 */
export default function useGasPrice(): JSBI | undefined {
  const { address } = useENSAddress('fast-gas-gwei.data.eth')
  const contract = useContract(address ?? undefined, CHAIN_DATA_ABI, false)

  const resultStr = useSingleCallResult(contract, 'latestAnswer').result?.[0]?.toString()
  return typeof resultStr === 'string' ? JSBI.BigInt(resultStr) : undefined
}
