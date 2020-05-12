import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys } from '.'
import { useTokenContract } from '../hooks'

function getTokenAllowance(
  contract: Contract,
  token: Token
): (_: SWRKeys, __: number, ___: string, owner: string, spender: string) => Promise<TokenAmount> {
  return async (_, __, ___, owner: string, spender: string): Promise<TokenAmount> =>
    contract
      .allowance(owner, spender)
      .then((balance: { toString: () => string }) => new TokenAmount(token, balance.toString()))
}

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount {
  const contract = useTokenContract(token?.address, false)
  const shouldFetch = !!contract && typeof owner === 'string' && typeof spender === 'string'

  const { data } = useSWR(
    shouldFetch ? [SWRKeys.Allowances, token.chainId, token.address, owner, spender] : null,
    getTokenAllowance(contract, token),
    {
      dedupingInterval: 10 * 1000,
      refreshInterval: 20 * 1000
    }
  )

  return data
}
