import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'

import { useTokenContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): CurrencyAmount<Token> | undefined {
  const contract = useTokenContract(token?.address, false)

  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token && totalSupply ? CurrencyAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}
