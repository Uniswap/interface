import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useChainId = (): UniverseChainId | undefined => {
  const { filteredChainIds, selectingCurrencyField, input } = useSwapFormContext()
  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const selectedChainId = filteredChainIds[selectingCurrencyField ?? CurrencyField.INPUT]

  if (selectedChainId || !isTestnetModeEnabled) {
    return selectedChainId
  }

  return filteredChainIds[CurrencyField.INPUT] ?? input?.chainId ?? defaultChainId
}
