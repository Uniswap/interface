import { type Currency, CurrencyAmount, type Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useReadContract } from 'wagmi'
import { erc20Abi } from '~/chains'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { assume0xAddress } from '~/utils/wagmi'

interface UseExistingTokenWalletBalanceResult {
  balance: CurrencyAmount<Token> | undefined
  isLoading: boolean
  isError: boolean
}

/**
 * Reads the connected EVM wallet's on-chain balance of the given token, on the token's own chain.
 *
 * Mirrors {@link useTotalSupply} (a direct wagmi `balanceOf` read keyed on the token's chainId)
 * rather than `useCurrencyBalance`, which gates on the wallet's currently-connected chain — an
 * existing auction token can live on a chain the wallet isn't actively connected to.
 */
export function useExistingTokenWalletBalance(token?: Currency): UseExistingTokenWalletBalanceResult {
  const account = useActiveAddress(Platform.EVM)
  const tokenAddress = token?.isToken ? assume0xAddress(token.address) : undefined

  const { data, isLoading, isError } = useReadContract({
    address: tokenAddress,
    chainId: token?.chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [assume0xAddress(account)] : undefined,
    query: { enabled: !!tokenAddress && !!account },
  })

  const balance = useMemo(
    () => (token?.isToken && data !== undefined ? CurrencyAmount.fromRawAmount(token, data.toString()) : undefined),
    [token, data],
  )

  return { balance, isLoading, isError }
}
