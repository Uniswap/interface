import { Interface } from '@ethersproject/abi'
import { NEVER_RELOAD, useMultipleContractSingleData } from 'lib/hooks/multicall'
import ERC20ABI from 'uniswap/src/abis/erc20.json'
import { Erc20Interface } from 'uniswap/src/abis/types/Erc20'

const ERC20Interface = new Interface(ERC20ABI) as Erc20Interface

export function useTokenContractsConstant(tokens: string[], field: 'name' | 'symbol' | 'decimals' | 'totalSupply') {
  return useMultipleContractSingleData(tokens, ERC20Interface, field, undefined, NEVER_RELOAD)
}
