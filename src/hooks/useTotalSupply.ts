import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Currency } from '@uniswap/sdk-core'
import { useTokenContract } from './useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Currency): CurrencyAmount | undefined {
  const contract = useTokenContract(token?.isToken ? token.address : undefined, false)

  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token && totalSupply ? CurrencyAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}
