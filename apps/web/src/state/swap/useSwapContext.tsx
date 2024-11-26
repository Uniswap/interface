import { useAccount } from 'hooks/useAccount'
import { useContext } from 'react'
import { SwapAndLimitContext, SwapContext } from 'state/swap/types'

export function useSwapContext() {
  return useContext(SwapContext)
}

export function useSwapAndLimitContext() {
  const account = useAccount()
  const context = useContext(SwapAndLimitContext)

  // Certain components are used both inside the swap and limit context, and outside of it.
  // One example is the CurrencySearch component, which is used in the swap context, but also in
  // the add/remove liquidity flows, nft flows, etc. In these cases, we want to use the chainId
  // from the provider account (hooks/useAccount), instead of the swap context chainId.
  return {
    ...context,
    chainId: context.isSwapAndLimitContext ? context.chainId : account.chainId,
  }
}
