import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import type { PermissionedSwapPairResult } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'

// Centralize the swap-form gating predicate so consumers re-render off the same source.
export function useActiveSwapPermissionedState(): PermissionedSwapPairResult {
  const { currencies, chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
    chainId: s.chainId,
  }))
  const platform = chainIdToPlatform(chainId)
  const activeAccount = useActiveAccount(platform)
  return usePermissionedSwapPair({
    inputCurrency: currencies[CurrencyField.INPUT]?.currency,
    outputCurrency: currencies[CurrencyField.OUTPUT]?.currency,
    walletAddress: activeAccount?.address,
  })
}
