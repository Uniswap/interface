import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useTokenContract } from './useContract'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Currency): CurrencyAmount<Token> | any | undefined {
  const contract = useTokenContract(token?.wrapped?.address ?? (token as any)?.address ?? undefined, false)
  const [totalSupply, setTotalSupply] = useState<CurrencyAmount<any> | undefined>() 

  useEffect(() => {
    const asyncFetch = async () => {
      const ts: BigNumber =  await contract.totalSupply();
      if (ts && !totalSupply && token) setTotalSupply(CurrencyAmount.fromRawAmount(token, ts.toString()))
    }
    if (!totalSupply && token) 
      asyncFetch()
}, [totalSupply, token]
)

  const tSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]
  return token && tSupply && token.chainId != 56 ? CurrencyAmount.fromRawAmount(token, tSupply.toString()) : totalSupply? totalSupply : undefined
}
