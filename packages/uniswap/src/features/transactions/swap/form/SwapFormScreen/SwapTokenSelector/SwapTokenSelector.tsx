import type { BottomSheetView } from '@gorhom/bottom-sheet'
import type { ComponentProps } from 'react'
import type { RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { TokenSelectorModal } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import {
  useOnSelectCurrency,
  useOnSelectTradeableAsset,
} from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { useChainId } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useChainId'
import { useHideTokenSelector } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapTokenSelector/hooks/useHideTokenSelector'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

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

  const addresses = useActiveAddresses()
  const chainId = useChainId()

  const handleHideTokenSelector = useHideTokenSelector()
  const onSelectCurrency = useOnSelectCurrency({ onSelect: handleHideTokenSelector })

  const selectTradeableAsset = useOnSelectTradeableAsset({ onSelect: handleHideTokenSelector })
  const onSelectRwaToken = useEvent((option: RwaTokenOption) => {
    if (!selectingCurrencyField) {
      return
    }
    selectTradeableAsset({
      tradeableAsset: { address: option.address, chainId: option.chainId, type: AssetType.Currency },
      field: selectingCurrencyField,
      allowCrossChainPair: false,
    })
  })

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
      addresses={addresses}
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
      onSelectRwaToken={onSelectRwaToken}
    />
  )
}
