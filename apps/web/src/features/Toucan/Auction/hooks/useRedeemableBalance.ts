import ms from 'ms'
import { useMemo } from 'react'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useReadContract } from 'wagmi'
import { erc20Abi } from '~/chains'
import { assume0xAddress } from '~/utils/wagmi'

/**
 * Reads the connected EVM wallet's on-chain balance of a token.
 *
 * For the redeem flow this is the live source of truth for how much the user can redeem right
 * now: it is 0 before they claim the auction token into their wallet, equals their holdings
 * after claiming, and returns to 0 once they redeem — so the redeem UI tracks the full lifecycle
 * without depending on (static) auction bid data.
 */
export function useRedeemableBalance({
  tokenAddress,
  chainId,
  enabled = true,
}: {
  tokenAddress?: string
  chainId?: EVMUniverseChainId
  enabled?: boolean
}): { balance: bigint | undefined; loading: boolean } {
  const account = useActiveAddress(Platform.EVM)
  const accountAddress = assume0xAddress(account)

  const { data, isLoading } = useReadContract({
    address: assume0xAddress(tokenAddress),
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: enabled && Boolean(tokenAddress && chainId && accountAddress),
      staleTime: ms('30s'),
    },
  })

  return useMemo(
    () => ({ balance: typeof data === 'bigint' ? data : undefined, loading: isLoading }),
    [data, isLoading],
  )
}
