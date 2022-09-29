import { BigNumber } from '@ethersproject/bignumber'
import { Token, TokenAmount } from '@teleswap/sdk'
import { Interface } from 'ethers/lib/utils'

import ERC20_ABI from '../constants/abis/erc20.json'
import { useTokenContract } from '../hooks/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from '../state/multicall/hooks'

const erc20Interface = new Interface(ERC20_ABI)

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token && totalSupply ? new TokenAmount(token, totalSupply.toString()) : undefined
}

/**
 * @warning this code have not been tested yet, use it AT YOUR OWN RISK!
 * @param tokens list of tokens
 * @returns the total supplies of given token
 */
export function useTotalSupplies(tokens: (Token | undefined)[]): (TokenAmount | undefined)[] {
  const tokenAddresses = tokens.map((token) => (token ? token.address : undefined))
  const totalSupplies = useMultipleContractSingleData(tokenAddresses, erc20Interface, 'totalSupply')
  return totalSupplies.map((res, i) => {
    const token = tokens[i]
    if (!token) return undefined
    const { result, loading } = res
    if (loading) return undefined
    const totalSupply: BigNumber = result?.at(0)
    return totalSupply ? new TokenAmount(token, totalSupply.toString()) : undefined
  })
}
