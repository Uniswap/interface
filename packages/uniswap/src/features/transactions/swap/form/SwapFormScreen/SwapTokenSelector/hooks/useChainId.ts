import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useChainId = (): UniverseChainId | undefined => {
  const { filteredChainIds, selectingCurrencyField, input } = useSwapFormStore((s) => ({
    filteredChainIds: s.filteredChainIds,
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
  }))
  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const selectedChainId = filteredChainIds?.[selectingCurrencyField ?? CurrencyField.INPUT]

  if (selectedChainId || !isTestnetModeEnabled) {
    return selectedChainId
  }

  return filteredChainIds?.[CurrencyField.INPUT] ?? input?.chainId ?? defaultChainId
}
