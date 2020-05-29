import { BigNumber } from '@ethersproject/bignumber'
import { Token, TokenAmount } from '@uniswap/sdk'
import { useTokenContract } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.[0]

  return token && totalSupply ? new TokenAmount(token, totalSupply.toString()) : undefined
}
