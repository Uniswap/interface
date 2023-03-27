import { Interface } from '@ethersproject/abi'
import ERC20ABI from 'abis/erc20.json'
import { Erc20Interface } from 'abis/types/Erc20'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

const ERC20Interface = new Interface(ERC20ABI) as Erc20Interface

export function useTokenContractsConstant(tokens: string[], field: 'name' | 'symbol' | 'decimals' | 'totalSupply') {
  const memoizedTokens = useMemo(() => tokens, [tokens])
  return useMultipleContractSingleData(memoizedTokens, ERC20Interface, field, undefined, {
    blocksPerFetch: 10_000,
  })
}
