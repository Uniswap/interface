import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { Currency } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { getSwappableTokensQueryData } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import type { TradeableAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { getShouldResetExactAmountToken } from 'uniswap/src/features/transactions/swap/form/utils'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import {
  getTokenAddressFromChainForTradingApi,
  toTradingApiSupportedChainId,
  tradingApiToUniverseChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { areCurrencyIdsEqual, currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useValueAsRef } from 'utilities/src/react/useValueAsRef'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function useOnSelectTradeableAsset({
  onSelect,
}: {
  onSelect?: () => void
}): ({
  tradeableAsset,
  field,
  allowCrossChainPair,
  isPreselectedAsset,
  selectedCurrency,
}: {
  tradeableAsset: TradeableAsset
  field: CurrencyField
  allowCrossChainPair: boolean
  isPreselectedAsset?: boolean
  selectedCurrency?: Currency
}) => void {
  const { onCurrencyChange } = useTransactionModalContext()
  const { output, input, exactCurrencyField, filteredChainIds, updateSwapForm } = useSwapFormStore((s) => ({
    output: s.output,
    input: s.input,
    exactCurrencyField: s.exactCurrencyField,
    filteredChainIds: s.filteredChainIds,
    updateSwapForm: s.updateSwapForm,
  }))

  const traceRef = useValueAsRef(useTrace())

  const inputCurrencyIds = useMemo(() => (input ? [currencyId(input)] : []), [input])
  const inputTokenProjects = useTokenProjects(inputCurrencyIds)
  const outputCurrencyIds = useMemo(() => (output ? [currencyId(output)] : []), [output])
  const outputTokenProjects = useTokenProjects(outputCurrencyIds)

  const queryClient = useQueryClient()

  return useEvent(
    ({
      tradeableAsset,
      field,
      allowCrossChainPair,
      isPreselectedAsset = false,
      selectedCurrency,
    }: {
      tradeableAsset: TradeableAsset
      field: CurrencyField
      allowCrossChainPair: boolean
      isPreselectedAsset?: boolean
      selectedCurrency?: Currency
    }) => {
      const newState: Partial<SwapFormState> = {}

      if (field === CurrencyField.OUTPUT) {
        newState.preselectAsset = isPreselectedAsset
      }

      const otherField = field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
      const otherFieldTradeableAsset = field === CurrencyField.INPUT ? output : input

      const otherFieldTokenProjects = otherField === CurrencyField.INPUT ? inputTokenProjects : outputTokenProjects

      const isBridgePair =
        allowCrossChainPair ||
        (otherFieldTradeableAsset
          ? checkIsBridgePair({
              queryClient,
              input: field === CurrencyField.INPUT ? tradeableAsset : otherFieldTradeableAsset,
              output: field === CurrencyField.OUTPUT ? tradeableAsset : otherFieldTradeableAsset,
            })
          : false)

      // swap order if tokens are the same
      if (
        otherFieldTradeableAsset &&
        areCurrencyIdsEqual(currencyId(tradeableAsset), currencyId(otherFieldTradeableAsset))
      ) {
        const previouslySelectedTradableAsset = field === CurrencyField.INPUT ? input : output
        // Given that we're swapping the order of tokens, we should also swap the `exactCurrencyField` and update the `focusOnCurrencyField` to make sure the correct input field is focused.
        newState.exactCurrencyField =
          exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
        newState.focusOnCurrencyField = newState.exactCurrencyField
        newState[otherField] = previouslySelectedTradableAsset
      } else if (
        otherFieldTradeableAsset &&
        tradeableAsset.chainId !== otherFieldTradeableAsset.chainId &&
        !isBridgePair
      ) {
        // if new token chain changes, try to find the other token's match on the new chain
        newState[otherField] = resolveOtherFieldOnChainChange({
          tradeableAsset,
          otherFieldTokenProjects,
        })
      }

      if (!isBridgePair) {
        const newFilteredChainIds = { ...filteredChainIds }

        newFilteredChainIds[CurrencyField.INPUT] = tradeableAsset.chainId
        newFilteredChainIds[CurrencyField.OUTPUT] = tradeableAsset.chainId

        newState.filteredChainIds = newFilteredChainIds
      }

      newState[field] = tradeableAsset

      if (getShouldResetExactAmountToken({ input, output, exactCurrencyField }, newState)) {
        newState.exactAmountToken = ''
        newState.exactAmountFiat = ''
      }

      // TODO(WEB-6230): This value is not what we want here, as it breaks bridging in the interface's TDP.
      //                 Instead, what we want is the `Currency` object from `newState[otherField] || otherFieldTradeableAsset`.
      const todoFixMeOtherCurrency = otherFieldTokenProjects.data?.find(
        (project) => project.currency.chainId === tradeableAsset.chainId,
      )

      const currencyState: { inputCurrency?: Currency; outputCurrency?: Currency } = {
        inputCurrency: CurrencyField.INPUT === field ? selectedCurrency : todoFixMeOtherCurrency?.currency,
        outputCurrency: CurrencyField.OUTPUT === field ? selectedCurrency : todoFixMeOtherCurrency?.currency,
      }

      onSelect?.()
      updateSwapForm(newState)
      maybeLogFirstSwapAction(traceRef.current)
      onCurrencyChange?.(currencyState, isBridgePair)
    },
  )
}

export function useOnSelectCurrency({
  onSelect,
}: {
  onSelect?: () => void
}): ({
  currency,
  field,
  allowCrossChainPair,
  isPreselectedAsset,
}: {
  currency: Currency
  field: CurrencyField
  allowCrossChainPair: boolean
  isPreselectedAsset: boolean
}) => void {
  const selectTradeableAsset = useOnSelectTradeableAsset({ onSelect })
  return useEvent(({ currency, field, allowCrossChainPair, isPreselectedAsset }) =>
    selectTradeableAsset({
      tradeableAsset: { address: currencyAddress(currency), chainId: currency.chainId, type: AssetType.Currency },
      field,
      allowCrossChainPair,
      isPreselectedAsset,
      selectedCurrency: currency,
    }),
  )
}

/**
 * When the newly-selected token changes chain, try to find the other field's matching token on the
 * new chain. Returns the matching token as a `TradeableAsset`, or `undefined` if there's no match
 * (or the match would collide with the newly-selected token).
 */
function resolveOtherFieldOnChainChange({
  tradeableAsset,
  otherFieldTokenProjects,
}: {
  tradeableAsset: TradeableAsset
  otherFieldTokenProjects: { data?: CurrencyInfo[] }
}): TradeableAsset | undefined {
  const otherCurrencyInNewChain = otherFieldTokenProjects.data?.find(
    (project) => project.currency.chainId === tradeableAsset.chainId,
  )

  const otherTradeableAssetInNewChain: TradeableAsset | undefined = otherCurrencyInNewChain && {
    address: currencyAddress(otherCurrencyInNewChain.currency),
    chainId: otherCurrencyInNewChain.currency.chainId,
    type: AssetType.Currency,
  }

  return otherTradeableAssetInNewChain &&
    otherCurrencyInNewChain &&
    !areCurrencyIdsEqual(currencyId(tradeableAsset), otherCurrencyInNewChain.currencyId)
    ? otherTradeableAssetInNewChain
    : undefined
}

/**
 * Checks if the newly selected input/output token is bridgeable.
 * We want this to be a synchronous check, so it assumes we've called `usePrefetchSwappableTokens` for whichever token had been selected first.
 */
function checkIsBridgePair({
  queryClient,
  input,
  output,
}: {
  queryClient: QueryClient
  input: TradeableAsset
  output: TradeableAsset
}): boolean {
  if (input.chainId === output.chainId) {
    return false
  }

  const tokenIn = getTokenAddressFromChainForTradingApi(input.address, input.chainId)
  const tokenInChainId = toTradingApiSupportedChainId(input.chainId)
  const tokenOut = getTokenAddressFromChainForTradingApi(output.address, output.chainId)
  const tokenOutChainId = toTradingApiSupportedChainId(output.chainId)

  if (!tokenIn || !tokenInChainId || !tokenOut || !tokenOutChainId) {
    return false
  }

  // We assume that if you can swap A for B, then you can also swap B for A,
  // so we check both directions and return true if we have data for either direction.
  // We can guarantee that one of the 2 directions will already be cached (whichever token was selected first).

  const inputBridgePairs = getSwappableTokensQueryData({
    params: { tokenIn, tokenInChainId },
    queryClient,
  })

  const outputBridgePairs = getSwappableTokensQueryData({
    params: { tokenIn: tokenOut, tokenInChainId: tokenOutChainId },
    queryClient,
  })

  const inputHasMatchingBridgeToken =
    !!inputBridgePairs &&
    hasMatchingBridgeToken({
      bridgePairs: inputBridgePairs,
      tokenAddress: tokenOut,
      tokenChainId: tokenOutChainId,
    })

  const outputHasMatchingBridgeToken =
    !!outputBridgePairs &&
    hasMatchingBridgeToken({
      bridgePairs: outputBridgePairs,
      tokenAddress: tokenIn,
      tokenChainId: tokenInChainId,
    })

  return inputHasMatchingBridgeToken || outputHasMatchingBridgeToken
}

function hasMatchingBridgeToken({
  bridgePairs,
  tokenAddress,
  tokenChainId,
}: {
  bridgePairs: TradingApi.GetSwappableTokensResponse
  tokenAddress: Address
  tokenChainId: TradingApi.ChainId
}): boolean {
  const tokenUniverseChainId = tradingApiToUniverseChainId(tokenChainId)
  return !!bridgePairs.tokens.find((token) => {
    const bridgeTokenUniverseChainId = tradingApiToUniverseChainId(token.chainId)
    return (
      tokenUniverseChainId &&
      bridgeTokenUniverseChainId &&
      areAddressesEqual({
        addressInput1: { address: token.address, chainId: bridgeTokenUniverseChainId },
        addressInput2: { address: tokenAddress, chainId: tokenUniverseChainId },
      }) &&
      tokenUniverseChainId === bridgeTokenUniverseChainId
    )
  })
}
