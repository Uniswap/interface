import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import {
  TokenSelectorModal,
  TokenSelectorProps,
  TokenSelectorVariation,
} from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { SwapFormState, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, buildCurrencyId, currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'

export function SwapTokenSelector({ isModalOpen }: { isModalOpen: boolean }): JSX.Element {
  const account = useAccountMeta()
  const swapContext = useSwapFormContext()
  const { updateSwapForm, exactCurrencyField, selectingCurrencyField, output, input, filteredChainId } = swapContext
  const activeAccountAddress = account?.address

  if (isModalOpen && !selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  const onHideTokenSelector = useCallback(() => {
    updateSwapForm({ selectingCurrencyField: undefined })
  }, [updateSwapForm])

  const inputTokenProjects = useTokenProjects(input ? [buildCurrencyId(input.chainId, input.address)] : [])
  const outputTokenProjects = useTokenProjects(output ? [buildCurrencyId(output.chainId, output.address)] : [])

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField) => {
      const tradeableAsset: TradeableAsset = {
        address: currencyAddress(currency),
        chainId: currency.chainId,
        type: AssetType.Currency,
      }

      const newState: Partial<SwapFormState> = {}

      const otherField = field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
      const otherFieldTradeableAsset = field === CurrencyField.INPUT ? output : input

      // We need to parse this, because one value is 'Currency' type, other is 'TradeableAsset', so shallowCompare on objects wont work
      const chainsAreEqual = currency.chainId === otherFieldTradeableAsset?.chainId
      const addressesAreEqual = currencyAddress(currency) === otherFieldTradeableAsset?.address

      // swap order if tokens are the same
      if (chainsAreEqual && addressesAreEqual) {
        const previouslySelectedTradableAsset = field === CurrencyField.INPUT ? input : output
        // Given that we're swapping the order of tokens, we should also swap the `exactCurrencyField` and update the `focusOnCurrencyField` to make sure the correct input field is focused.
        newState.exactCurrencyField =
          exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
        newState.focusOnCurrencyField = newState.exactCurrencyField
        newState[otherField] = previouslySelectedTradableAsset
      } else if (!chainsAreEqual) {
        // if new token chain changes, try to find the other token's match on the new chain
        const otherFieldTokenProjects = otherField === CurrencyField.INPUT ? inputTokenProjects : outputTokenProjects
        const otherCurrency = otherFieldTokenProjects?.data?.find(
          (project) => project?.currency.chainId === currency.chainId,
        )
        const otherTradeableAsset: TradeableAsset | undefined = otherCurrency && {
          address: currencyAddress(otherCurrency?.currency),
          chainId: otherCurrency.currency.chainId,
          type: AssetType.Currency,
        }

        newState[otherField] =
          otherTradeableAsset && otherCurrency && !areCurrencyIdsEqual(currencyId(currency), otherCurrency.currencyId)
            ? otherTradeableAsset
            : undefined
      }

      newState.filteredChainId = currency.chainId
      newState[field] = tradeableAsset

      updateSwapForm(newState)

      // Hide screen when done selecting.
      onHideTokenSelector()
    },
    [exactCurrencyField, input, inputTokenProjects, onHideTokenSelector, output, outputTokenProjects, updateSwapForm],
  )

  const props: TokenSelectorProps = {
    isModalOpen,
    activeAccountAddress,
    chainId: filteredChainId,
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
