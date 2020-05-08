import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { useTokenContract } from '../hooks'

function getTokenAllowance(
  contract: Contract,
  token: Token
): (_: number, __: string, owner: string, spender: string) => Promise<TokenAmount> {
  return async (_, __, owner: string, spender: string): Promise<TokenAmount> =>
    contract
      .allowance(owner, spender)
      .then((balance: { toString: () => string }) => new TokenAmount(token, balance.toString()))
}

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): TokenAmount {
  const contract = useTokenContract(token?.address, false)
  const shouldFetch = !!contract && typeof owner === 'string' && typeof spender === 'string'

  const { data } = useSWR(
    shouldFetch ? [token.chainId, token.address, owner, spender] : null,
    getTokenAllowance(contract, token),
    {
      dedupingInterval: 7.5 * 1000,
      refreshInterval: 15 * 1000
    }
  )

  return data
}
