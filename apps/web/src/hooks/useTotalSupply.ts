import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'
import { assume0xAddress } from '~/utils/wagmi'

interface UseTotalSupplyResult {
  totalSupply: CurrencyAmount<Token> | undefined
  isLoading: boolean
  isError: boolean
}

export function useTotalSupply(token?: Currency): UseTotalSupplyResult {
  const address = token?.isToken ? assume0xAddress(token.address) : undefined

  const { data, isLoading, isError } = useReadContract({
    address,
    chainId: token?.chainId,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: { enabled: !!address },
  })

  const totalSupply = useMemo(
    () => (token?.isToken && data ? CurrencyAmount.fromRawAmount(token, data.toString()) : undefined),
    [token, data],
  )

  return { totalSupply, isLoading, isError }
}
