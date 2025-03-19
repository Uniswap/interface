import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { getSwappableTokensQueryData } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { ChainId, GetSwappableTokensResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapFormState, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { getShouldResetExactAmountToken } from 'uniswap/src/features/transactions/swap/form/utils'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import {
  getTokenAddressFromChainForTradingApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { areCurrencyIdsEqual, currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { useValueAsRef } from 'utilities/src/react/useValueAsRef'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function useOnSelectCurrency({
  onSelect,
}: {
  onSelect?: () => void
}): (currency: Currency, field: CurrencyField, forceIsBridgePair: boolean) => void {
  const { onCurrencyChange } = useTransactionModalContext()
  const swapContext = useSwapFormContext()

  const traceRef = useValueAsRef(useTrace())
  const swapContextRef = useValueAsRef(swapContext)

  const { updateSwapForm, output, input } = swapContext

  const inputTokenProjects = useTokenProjects(input ? [currencyId(input)] : [])
  const outputTokenProjects = useTokenProjects(output ? [currencyId(output)] : [])

  const queryClient = useQueryClient()

  return useCallback(
    // eslint-disable-next-line complexity
    (currency: Currency, field: CurrencyField, forceIsBridgePair: boolean) => {
      const swapCtx = swapContextRef.current

      const tradeableAsset: TradeableAsset = {
        address: currencyAddress(currency),
        chainId: currency.chainId,
        type: AssetType.Currency,
      }

      const newState: Partial<SwapFormState> = {}

      const otherField = field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
      const otherFieldTradeableAsset = field === CurrencyField.INPUT ? swapCtx.output : swapCtx.input

      const otherFieldTokenProjects = otherField === CurrencyField.INPUT ? inputTokenProjects : outputTokenProjects

      const isBridgePair =
        // `forceIsBridgePair` means the user explicitly selected a bridge pair.
        forceIsBridgePair ||
        (tradeableAsset && otherFieldTradeableAsset
          ? checkIsBridgePair({
              queryClient,
              input: field === CurrencyField.INPUT ? tradeableAsset : otherFieldTradeableAsset,
              output: field === CurrencyField.OUTPUT ? tradeableAsset : otherFieldTradeableAsset,
            })
          : false)

      // swap order if tokens are the same
      if (otherFieldTradeableAsset && areCurrencyIdsEqual(currencyId(currency), currencyId(otherFieldTradeableAsset))) {
        const previouslySelectedTradableAsset = field === CurrencyField.INPUT ? swapCtx.input : swapCtx.output
        // Given that we're swapping the order of tokens, we should also swap the `exactCurrencyField` and update the `focusOnCurrencyField` to make sure the correct input field is focused.
        newState.exactCurrencyField =
          swapCtx.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
        newState.focusOnCurrencyField = newState.exactCurrencyField
        newState[otherField] = previouslySelectedTradableAsset
      } else if (otherFieldTradeableAsset && currency.chainId !== otherFieldTradeableAsset.chainId && !isBridgePair) {
        const otherCurrencyInNewChain = otherFieldTokenProjects?.data?.find(
          (project) => project?.currency.chainId === currency.chainId,
        )

        // if new token chain changes, try to find the other token's match on the new chain
        const otherTradeableAssetInNewChain: TradeableAsset | undefined = otherCurrencyInNewChain && {
          address: currencyAddress(otherCurrencyInNewChain.currency),
          chainId: otherCurrencyInNewChain.currency.chainId,
          type: AssetType.Currency,
        }

        newState[otherField] =
          otherTradeableAssetInNewChain &&
          otherCurrencyInNewChain &&
          !areCurrencyIdsEqual(currencyId(currency), otherCurrencyInNewChain.currencyId)
            ? otherTradeableAssetInNewChain
            : undefined
      }

      if (!isBridgePair) {
        // If selecting output, set the input and output chainIds
        // If selecting input and output is already selected, also set the input chainId
        if (field === CurrencyField.OUTPUT || !!swapCtx.output) {
          swapCtx.filteredChainIds[CurrencyField.INPUT] = currency.chainId
          swapCtx.filteredChainIds[CurrencyField.OUTPUT] = currency.chainId
          // If selecting input, only set the output chainId
        } else {
          swapCtx.filteredChainIds[CurrencyField.OUTPUT] = currency.chainId
        }

        newState.filteredChainIds = swapCtx.filteredChainIds
      }

      newState[field] = tradeableAsset

      if (getShouldResetExactAmountToken(swapCtx, newState)) {
        newState.exactAmountToken = ''
      }

      // TODO(WEB-6230): This value is not what we want here, as it breaks bridging in the interface's TDP.
      //                 Instead, what we want is the `Currency` object from `newState[otherField] || otherFieldTradeableAsset`.
      const todoFixMeOtherCurrency = otherFieldTokenProjects?.data?.find(
        (project) => project?.currency.chainId === currency.chainId,
      )

      const currencyState: { inputCurrency?: Currency; outputCurrency?: Currency } = {
        inputCurrency: CurrencyField.INPUT === field ? currency : todoFixMeOtherCurrency?.currency,
        outputCurrency: CurrencyField.OUTPUT === field ? currency : todoFixMeOtherCurrency?.currency,
      }

      onSelect?.()
      updateSwapForm(newState)
      maybeLogFirstSwapAction(traceRef.current)
      onCurrencyChange?.(currencyState, isBridgePair)
    },
    // We want to be very careful about how often this function is re-created because it causes the entire token selector list to re-render.
    // This is why we use `swapContextRef` so that we can access the latest swap context without causing a re-render.
    // Do not add new dependencies to this function unless you are sure this won't degrade perf.
    [
      swapContextRef,
      inputTokenProjects,
      outputTokenProjects,
      queryClient,
      onSelect,
      updateSwapForm,
      traceRef,
      onCurrencyChange,
    ],
  )
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
  bridgePairs: GetSwappableTokensResponse
  tokenAddress: Address
  tokenChainId: ChainId
}): boolean {
  return !!bridgePairs.tokens.find(
    (token) => areAddressesEqual(token.address, tokenAddress) && token.chainId === tokenChainId,
  )
}
