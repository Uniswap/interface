import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys } from '.'
import { useTokenContract } from '../hooks'
import { useBlockNumber } from '../state/application/hooks'

function getTokenAllowance(contract: Contract, token: Token): (owner: string, spender: string) => Promise<TokenAmount> {
  return async (owner: string, spender: string): Promise<TokenAmount> =>
    contract
      .allowance(owner, spender)
      .then((balance: { toString: () => string }) => new TokenAmount(token, balance.toString()))
}

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount {
  const blockNumber = useBlockNumber()
  const contract = useTokenContract(token?.address, false)
  const shouldFetch = !!contract && typeof owner === 'string' && typeof spender === 'string'

  const { data } = useSWR(
    shouldFetch ? [owner, spender, token.chainId, token.address, SWRKeys.Allowances, blockNumber] : null,
    getTokenAllowance(contract, token),
    {
      dedupingInterval: 4 * 1000
    }
  )

  return data
}
