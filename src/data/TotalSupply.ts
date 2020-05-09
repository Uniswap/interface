import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'
import { abi as IERC20ABI } from '@uniswap/v2-core/build/IERC20.json'

import { useContract } from '../hooks'
import { SWRKeys } from '.'

function getTotalSupply(contract: Contract, token: Token): () => Promise<TokenAmount> {
  return async (): Promise<TokenAmount> =>
    contract
      .totalSupply()
      .then((totalSupply: { toString: () => string }) => new TokenAmount(token, totalSupply.toString()))
}

export function useTotalSupply(token?: Token): TokenAmount {
  const contract = useContract(token?.address, IERC20ABI, false)
  const shouldFetch = !!contract
  const { data } = useSWR(
    shouldFetch ? [SWRKeys.TotalSupply, token.chainId, token.address] : null,
    getTotalSupply(contract, token),
    {
      dedupingInterval: 10 * 1000,
      refreshInterval: 20 * 1000
    }
  )
  return data
}
