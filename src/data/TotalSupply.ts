import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'

import { SWRKeys, useKeepSWRDataLiveAsBlocksArrive } from '.'
import { useTokenContract } from '../hooks/useContract'

function getTotalSupply(contract: Contract, token: Token): () => Promise<TokenAmount> {
  return async (): Promise<TokenAmount> =>
    contract
      .totalSupply()
      .then((totalSupply: { toString: () => string }) => new TokenAmount(token, totalSupply.toString()))
}

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const { data, mutate } = useSWR(
    token ? [token.address, token.chainId, SWRKeys.TotalSupply] : null,
    token && contract ? getTotalSupply(contract, token) : () => undefined
  )
  useKeepSWRDataLiveAsBlocksArrive(mutate)

  return data
}
