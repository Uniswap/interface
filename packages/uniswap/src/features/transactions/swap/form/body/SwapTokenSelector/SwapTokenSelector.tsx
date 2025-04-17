import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useChainId } from 'uniswap/src/features/transactions/swap/form/body/SwapTokenSelector/hooks/useChainId'
import { useHideTokenSelector } from 'uniswap/src/features/transactions/swap/form/body/SwapTokenSelector/hooks/useHideTokenSelector'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/form/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'

export function SwapTokenSelector({ isModalOpen }: { isModalOpen: boolean }): JSX.Element | null {
  const { selectingCurrencyField, input } = useSwapFormContext()

  const activeAccountAddress = useAccountMeta()?.address
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
      activeAccountAddress={activeAccountAddress}
      chainId={chainId}
      input={input}
      currencyField={selectingCurrencyField}
      flow={TokenSelectorFlow.Swap}
      variation={
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.SwapInput
          : TokenSelectorVariation.SwapOutput
      }
      onClose={handleHideTokenSelector}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
