import { useRef, useEffect } from 'react'
import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'
import { abi as IERC20ABI } from '@uniswap/v2-core/build/IERC20.json'

import { useContract } from '../hooks'
import { SWRKeys } from '.'
import { useBlockNumber } from '../state/application/hooks'

function getTotalSupply(contract: Contract, token: Token): () => Promise<TokenAmount> {
  return async (): Promise<TokenAmount> =>
    contract
      .totalSupply()
      .then((totalSupply: { toString: () => string }) => new TokenAmount(token, totalSupply.toString()))
}

export function useTotalSupply(token?: Token): TokenAmount {
  const contract = useContract(token?.address, IERC20ABI, false)

  const shouldFetch = !!contract
  const { data, mutate } = useSWR(
    shouldFetch ? [token.address, token.chainId, SWRKeys.TotalSupply] : null,
    getTotalSupply(contract, token)
  )

  // fetch data again every time there's a new block
  const mutateRef = useRef(mutate)
  useEffect(() => {
    mutateRef.current = mutate
  })
  const blockNumber = useBlockNumber()
  useEffect(() => {
    mutateRef.current()
  }, [blockNumber])

  return data
}
