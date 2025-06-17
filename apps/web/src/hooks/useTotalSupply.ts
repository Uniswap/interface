import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Currency): CurrencyAmount<Token> | undefined {
  const address = token?.isToken ? assume0xAddress(token.address) : undefined

  const { data } = useReadContract({ address, chainId: token?.chainId, abi: erc20Abi, functionName: 'totalSupply' })

  return useMemo(
    () => (token?.isToken && data ? CurrencyAmount.fromRawAmount(token, data.toString()) : undefined),
    [token, data],
  )
}
