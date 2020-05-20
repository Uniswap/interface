import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys, useKeepSWRDataLiveAsBlocksArrive } from '.'
import { useTokenContract } from '../hooks'

function getTotalSupply(contract: Contract, token: Token): () => Promise<TokenAmount> {
  return async (): Promise<TokenAmount> =>
    contract
      .totalSupply()
      .then((totalSupply: { toString: () => string }) => new TokenAmount(token, totalSupply.toString()))
}

export function useTotalSupply(token?: Token): TokenAmount {
  const contract = useTokenContract(token?.address, false)

  const shouldFetch = !!contract
  const { data, mutate } = useSWR(
    shouldFetch ? [token.address, token.chainId, SWRKeys.TotalSupply] : null,
    getTotalSupply(contract, token)
  )
  useKeepSWRDataLiveAsBlocksArrive(mutate)

  return data
}
