import { useMemo } from 'react'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { formatUnits } from 'viem'
import { UniswapXSwapRequest } from 'wallet/src/components/dappRequests/types/Permit2Types'
import {
  ParsedTransactionData,
  TransactionAsset,
  TransactionRiskLevel,
  TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'
import { roundToDecimals } from 'wallet/src/features/dappRequests/utils/blockaidUtils'

interface UseParseUniswapXSwapResult extends ParsedTransactionData {
  /** Whether the hook is still loading currency info */
  isLoading: boolean
}

/**
 * Hook to parse UniswapX swap typed data into TransactionSection format
 * compatible with TransactionPreviewCard display.
 *
 * @param typedData - The UniswapX swap request typed data, or null if not a UniswapX swap
 * @param chainId - The chain ID for the swap
 * @returns ParsedTransactionData with Sending/Receiving sections, or empty sections if typedData is null
 */
export function useParseUniswapXSwap(
  typedData: UniswapXSwapRequest | null,
  chainId: UniverseChainId,
): UseParseUniswapXSwapResult {
  // Extract token addresses and amounts from typed data (if present)
  const inputToken = typedData?.message.permitted.token
  const inputAmountRaw = typedData?.message.permitted.amount
  const outputToken = typedData?.message.witness.baseOutputs[0]?.token
  const outputAmountRaw = typedData?.message.witness.baseOutputs[0]?.startAmount

  // Handle native ETH output address mapping
  const normalizedOutputToken = outputToken === DEFAULT_NATIVE_ADDRESS ? DEFAULT_NATIVE_ADDRESS_LEGACY : outputToken

  // Resolve currency info using hooks (will return null if token addresses are undefined)
  const inputCurrencyId = inputToken ? buildCurrencyId(chainId, inputToken) : undefined
  const outputCurrencyId = normalizedOutputToken ? buildCurrencyId(chainId, normalizedOutputToken) : undefined

  const { currencyInfo: inputCurrencyInfo, loading: inputLoading } = useCurrencyInfoWithLoading(inputCurrencyId)
  const { currencyInfo: outputCurrencyInfo, loading: outputLoading } = useCurrencyInfoWithLoading(outputCurrencyId)

  // Determine loading state - only loading if we have typed data and either currency query is still loading
  const isLoading = typedData !== null && (inputLoading || outputLoading)

  // Build transaction sections
  const sections = useMemo((): TransactionSection[] => {
    // Return empty sections if not a UniswapX swap
    if (!typedData || !inputToken || !normalizedOutputToken) {
      return []
    }

    const result: TransactionSection[] = []

    // Format amounts using token decimals
    const inputDecimals = inputCurrencyInfo?.currency.decimals ?? 18
    const outputDecimals = outputCurrencyInfo?.currency.decimals ?? 18

    const formattedInputAmount = inputAmountRaw
      ? roundToDecimals(formatUnits(BigInt(inputAmountRaw), inputDecimals))
      : undefined
    const formattedOutputAmount = outputAmountRaw
      ? roundToDecimals(formatUnits(BigInt(outputAmountRaw), outputDecimals))
      : undefined

    // Create sending section (input token)
    const sendingAsset: TransactionAsset = {
      type: 'ERC20',
      address: inputToken,
      chainId,
      symbol: inputCurrencyInfo?.currency.symbol,
      name: inputCurrencyInfo?.currency.name,
      amount: formattedInputAmount,
      logoUrl: inputCurrencyInfo?.logoUrl ?? undefined,
    }

    result.push({
      type: TransactionSectionType.Sending,
      assets: [sendingAsset],
    })

    // Create receiving section (output token)
    const receivingAsset: TransactionAsset = {
      type: normalizedOutputToken === DEFAULT_NATIVE_ADDRESS_LEGACY ? 'NATIVE' : 'ERC20',
      address: normalizedOutputToken,
      chainId,
      symbol: outputCurrencyInfo?.currency.symbol,
      name: outputCurrencyInfo?.currency.name,
      amount: formattedOutputAmount,
      logoUrl: outputCurrencyInfo?.logoUrl ?? undefined,
    }

    result.push({
      type: TransactionSectionType.Receiving,
      assets: [receivingAsset],
    })

    return result
  }, [
    typedData,
    chainId,
    inputToken,
    normalizedOutputToken,
    inputAmountRaw,
    outputAmountRaw,
    inputCurrencyInfo,
    outputCurrencyInfo,
  ])

  return {
    sections,
    riskLevel: TransactionRiskLevel.None, // Risk level comes from Blockaid scan
    isLoading,
  }
}
