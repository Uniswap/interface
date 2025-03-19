import { useCallback } from 'react'
import {
  TokenSelectorModal,
  TokenSelectorProps,
  TokenSelectorVariation,
} from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'

export function SwapTokenSelector({ isModalOpen }: { isModalOpen: boolean }): JSX.Element {
  const swapContext = useSwapFormContext()

  const activeAccountAddress = useAccountMeta()?.address

  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const { setIsSwapTokenSelectorOpen } = useUniswapContext()

  const { updateSwapForm, selectingCurrencyField, input, filteredChainIds, isSelectingCurrencyFieldPrefilled } =
    swapContext

  if (isModalOpen && !selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  const onHideTokenSelector = useCallback(() => {
    updateSwapForm({
      selectingCurrencyField: undefined,
      isSelectingCurrencyFieldPrefilled: false,
      // reset the filtered chain ids when coming back in from a prefill so it's not persisted forever
      ...(isSelectingCurrencyFieldPrefilled ? { filteredChainIds: {} } : {}),
    })
    setIsSwapTokenSelectorOpen(false) // resets force flag for web on close as cleanup
  }, [isSelectingCurrencyFieldPrefilled, setIsSwapTokenSelectorOpen, updateSwapForm])

  const onSelectCurrency = useOnSelectCurrency({ onSelect: onHideTokenSelector })

  const getChainId = (): UniverseChainId | undefined => {
    const selectedChainId = filteredChainIds[selectingCurrencyField ?? CurrencyField.INPUT]

    // allow undefined for prod networks
    if (selectedChainId || !isTestnetModeEnabled) {
      return selectedChainId
    }

    // should never be undefined for testnets
    return filteredChainIds[CurrencyField.INPUT] ?? input?.chainId ?? defaultChainId
  }

  const props: TokenSelectorProps = {
    isModalOpen,
    activeAccountAddress,
    chainId: getChainId(),
    input,
    // token selector modal will only open on currency field selection; casting to satisfy typecheck here - we should consider refactoring the types here to avoid casting
    currencyField: selectingCurrencyField as CurrencyField,
    flow: TokenSelectorFlow.Swap,
    variation:
      selectingCurrencyField === CurrencyField.INPUT
        ? TokenSelectorVariation.SwapInput
        : TokenSelectorVariation.SwapOutput,
    onClose: onHideTokenSelector,
    onSelectCurrency,
  }
  return <TokenSelectorModal {...props} />
}
