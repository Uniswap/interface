import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys, useKeepSWRDataLiveAsBlocksArrive } from '.'
import { useTokenContract } from '../hooks'

function getTokenAllowance(contract: Contract, token: Token): (owner: string, spender: string) => Promise<TokenAmount> {
  return async (owner: string, spender: string): Promise<TokenAmount> =>
    contract
      .allowance(owner, spender)
      .then((balance: { toString: () => string }) => new TokenAmount(token, balance.toString()))
}

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount {
  const contract = useTokenContract(token?.address, false)

  const shouldFetch = !!contract && typeof owner === 'string' && typeof spender === 'string'
  const { data, mutate } = useSWR(
    shouldFetch ? [owner, spender, token.address, token.chainId, SWRKeys.Allowances] : null,
    getTokenAllowance(contract, token)
  )
  useKeepSWRDataLiveAsBlocksArrive(mutate)

  return data
}
