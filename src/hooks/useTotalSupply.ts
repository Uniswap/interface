import { Currency, CurrencyAmount, Token } from '@thinkincoin-libs/sdk-core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { useTokenContract } from './useContract'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Currency): CurrencyAmount<Token> | undefined {
  const contract = useTokenContract(token?.isToken ? token.address : undefined, false)

  const totalSupplyStr: string | undefined = useSingleCallResult(contract, 'totalSupply')?.result?.[0]?.toString()

  return useMemo(
    () => (token?.isToken && totalSupplyStr ? CurrencyAmount.fromRawAmount(token, totalSupplyStr) : undefined),
    [token, totalSupplyStr]
  )
}
