import { useAccount } from 'hooks/useAccount'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useAddressFromEns } from 'uniswap/src/features/ens/api'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

const CHAIN_DATA_ABI = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Returns the price of 1 gas in WEI for the currently selected network using the chainlink fast gas price oracle
 */
export default function useGasPrice(skip = false): JSBI | undefined {
  const { chainId } = useAccount()
  const { data: address } = useAddressFromEns('fast-gas-gwei.data.eth')

  const { data } = useReadContract({
    address: assume0xAddress(address ?? undefined),
    chainId,
    abi: CHAIN_DATA_ABI,
    functionName: 'latestAnswer',
    query: { enabled: !skip },
  })

  return useMemo(() => (data ? JSBI.BigInt(Number(data)) : undefined), [data])
}
