import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useChainId = (): UniverseChainId | undefined => {
  const { filteredChainIds, selectingCurrencyField, input, output } = useSwapFormStore((s) => ({
    filteredChainIds: s.filteredChainIds,
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
    output: s.output,
  }))
  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const isChainedActionsEnabled = useFeatureFlag(FeatureFlags.ChainedActions)
  const selectedChainId = filteredChainIds?.[selectingCurrencyField ?? CurrencyField.INPUT]

  if (isChainedActionsEnabled) {
    // Show "All Networks" (ie. set network filter to `undefined`) in the token selector
    // unless the opposite token is on a chain that doesn't support chained actions.
    const oppositeToken = selectingCurrencyField === CurrencyField.INPUT ? output : input
    const oppositeChainSupportsChainedActions =
      !oppositeToken?.chainId || isChainSupportedForChainedActions(oppositeToken.chainId)

    if (oppositeChainSupportsChainedActions) {
      return undefined
    }
  }

  if (selectedChainId || !isTestnetModeEnabled) {
    return selectedChainId
  }

  return filteredChainIds?.[CurrencyField.INPUT] ?? input?.chainId ?? defaultChainId
}
