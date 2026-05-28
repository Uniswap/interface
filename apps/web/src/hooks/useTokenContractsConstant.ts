import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContracts } from 'wagmi'

export function useTokenContractsConstant(
  tokens: string[],
  field: 'name' | 'symbol' | 'decimals' | 'totalSupply',
): { result?: string | number | bigint }[] | undefined {
  return useReadContracts({
    contracts: tokens.map((token) => ({
      address: assume0xAddress(token),
      abi: erc20Abi,
      functionName: field,
    })),
  }).data
}
