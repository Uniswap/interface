import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import {
  TokenSelectorModal,
  TokenSelectorProps,
  TokenSelectorVariation,
} from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useAccountMeta, useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { SwapFormState, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function SwapTokenSelector({ isModalOpen }: { isModalOpen: boolean }): JSX.Element {
  const trace = useTrace()
  const account = useAccountMeta()
  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const swapContext = useSwapFormContext()
  const { setIsSwapTokenSelectorOpen } = useUniswapContext()
  const { updateSwapForm, exactCurrencyField, selectingCurrencyField, output, input, filteredChainIds } = swapContext
  const activeAccountAddress = account?.address

  if (isModalOpen && !selectingCurrencyField) {
    throw new Error('TokenSelector rendered without `selectingCurrencyField`')
  }

  const onHideTokenSelector = useCallback(() => {
    updateSwapForm({ selectingCurrencyField: undefined })
    setIsSwapTokenSelectorOpen(false) // resets force flag for web on close as cleanup
  }, [setIsSwapTokenSelectorOpen, updateSwapForm])

  const inputTokenProjects = useTokenProjects(input ? [currencyId(input)] : [])
  const outputTokenProjects = useTokenProjects(output ? [currencyId(output)] : [])

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, isBridgePair: boolean) => {
      const tradeableAsset: TradeableAsset = {
        address: currencyAddress(currency),
        chainId: currency.chainId,
        type: AssetType.Currency,
      }

      const newState: Partial<SwapFormState> = {}

      const otherField = field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
      const otherFieldTradeableAsset = field === CurrencyField.INPUT ? output : input

      // swap order if tokens are the same
      if (otherFieldTradeableAsset && currencyId(currency) === currencyId(otherFieldTradeableAsset)) {
        const previouslySelectedTradableAsset = field === CurrencyField.INPUT ? input : output
        // Given that we're swapping the order of tokens, we should also swap the `exactCurrencyField` and update the `focusOnCurrencyField` to make sure the correct input field is focused.
        newState.exactCurrencyField =
          exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
        newState.focusOnCurrencyField = newState.exactCurrencyField
        newState[otherField] = previouslySelectedTradableAsset
      } else if (currency.chainId !== otherFieldTradeableAsset?.chainId && !isBridgePair) {
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

      if (!isBridgePair) {
        // If selecting output, set the input and output chainIds
        // If selecting input and output is already selected, also set the input chainId
        if (field === CurrencyField.OUTPUT || !!output) {
          filteredChainIds[CurrencyField.INPUT] = currency.chainId
          filteredChainIds[CurrencyField.OUTPUT] = currency.chainId
          // If selecting input, only set the output chainId
        } else {
          filteredChainIds[CurrencyField.OUTPUT] = currency.chainId
        }

        newState.filteredChainIds = filteredChainIds
      }

      newState[field] = tradeableAsset

      updateSwapForm(newState)

      // Hide screen when done selecting.
      onHideTokenSelector()

      maybeLogFirstSwapAction(trace)
    },
    [
      output,
      input,
      updateSwapForm,
      onHideTokenSelector,
      trace,
      exactCurrencyField,
      inputTokenProjects,
      outputTokenProjects,
      filteredChainIds,
    ],
  )

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
