import { Interface } from '@ethersproject/abi'
import ERC20ABI from 'abis/erc20.json'
import { Erc20Interface } from 'abis/types/Erc20'
import { NEVER_RELOAD, useMultipleContractSingleData } from 'lib/hooks/multicall'

const ERC20Interface = new Interface(ERC20ABI) as Erc20Interface

export function useTokenContractsConstant(tokens: string[], field: 'name' | 'symbol' | 'decimals' | 'totalSupply') {
  return useMultipleContractSingleData(tokens, ERC20Interface, field, undefined, NEVER_RELOAD)
}
