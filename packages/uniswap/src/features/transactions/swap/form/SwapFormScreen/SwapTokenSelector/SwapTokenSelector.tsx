import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { useChainId } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useChainId'
import { useHideTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useHideTokenSelector'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'

export function SwapTokenSelector({
  isModalOpen,
  focusHook,
}: {
  isModalOpen: boolean
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
}): JSX.Element | null {
  const { selectingCurrencyField, input, output } = useSwapFormStore((s) => ({
    selectingCurrencyField: s.selectingCurrencyField,
    input: s.input,
    output: s.output,
  }))

  const wallet = useWallet()
  const activeEVMAccountAddress = wallet.evmAccount?.address
  const activeSVMAccountAddress = wallet.svmAccount?.address
  const chainId = useChainId()

  const handleHideTokenSelector = useHideTokenSelector()
  const onSelectCurrency = useOnSelectCurrency({ onSelect: handleHideTokenSelector })

  if (!isModalOpen) {
    // `TokenSelectorModal` already returns `null` when `isModalOpen` is `false
    // We're adding this extra check, here, to satisfy typescript
    return null
  }

  if (!selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  return (
    <TokenSelectorModal
      isModalOpen={isModalOpen}
      evmAddress={activeEVMAccountAddress}
      svmAddress={activeSVMAccountAddress}
      chainId={chainId}
      input={input}
      output={output}
      currencyField={selectingCurrencyField}
      flow={TokenSelectorFlow.Swap}
      variation={
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.SwapInput
          : TokenSelectorVariation.SwapOutput
      }
      focusHook={focusHook}
      onClose={handleHideTokenSelector}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
