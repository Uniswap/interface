import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromUniswapWebAppLink, isTestnetChain } from 'uniswap/src/features/chains/utils'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

/**
 * Supported swap link formats:
 *
 * 1. Mobile format (legacy):
 *    - inputCurrencyId: chainId-tokenAddress (e.g., "1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
 *    - outputCurrencyId: chainId-tokenAddress
 *    - currencyField: "input" | "output"
 *    - amount: string number
 *
 * 2. Universal format:
 *    - inputCurrency: tokenAddress | "ETH" | "NATIVE"
 *    - outputCurrency: tokenAddress | "ETH" | "NATIVE"
 *    - chain: chain name (e.g., "ethereum", "polygon", "arbitrum")
 *    - outputChain: chain name (for cross-chain swaps)
 *    - value: string number
 *    - field: "INPUT" | "OUTPUT"
 */

interface ParsedSwapLinkParams {
  inputAsset: CurrencyAsset | null
  outputAsset: CurrencyAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
}

export type ParseSwapLinkFunction = (url: URL) => ParsedSwapLinkParams

/**
 * Creates a TransactionState from parsed swap link parameters
 */
export function createSwapTransactionState(params: ParsedSwapLinkParams): TransactionState {
  return {
    [CurrencyField.INPUT]: params.inputAsset,
    [CurrencyField.OUTPUT]: params.outputAsset,
    exactCurrencyField: params.exactCurrencyField,
    exactAmountToken: params.exactAmountToken,
  }
}

/**
 * Validates that swap chains are compatible (both testnet or both mainnet)
 */
function validateSwapChainCompatibility(inputChainId: UniverseChainId, outputChainId: UniverseChainId): void {
  if (isTestnetChain(inputChainId) !== isTestnetChain(outputChainId)) {
    throw new Error('Cannot swap between testnet and mainnet')
  }
}

export function parseSwapLinkMobileFormatOrThrow(url: URL): ParsedSwapLinkParams {
  const inputCurrencyId = url.searchParams.get('inputCurrencyId')
  const outputCurrencyId = url.searchParams.get('outputCurrencyId')
  const currencyField = url.searchParams.get('currencyField')
  const exactAmountToken = url.searchParams.get('amount') ?? '0'

  // Check if this looks like mobile format
  if (!inputCurrencyId || !outputCurrencyId) {
    throw new Error('Not mobile format - missing currencyId parameters')
  }

  const inputChain = currencyIdToChain(inputCurrencyId)
  const inputAddress = currencyIdToAddress(inputCurrencyId)
  const outputChain = currencyIdToChain(outputCurrencyId)
  const outputAddress = currencyIdToAddress(outputCurrencyId)

  if (!inputChain || !inputAddress) {
    throw new Error('Invalid inputCurrencyId. Must be of format `<chainId>-<tokenAddress>`')
  }

  if (!outputChain || !outputAddress) {
    throw new Error('Invalid outputCurrencyId. Must be of format `<chainId>-<tokenAddress>`')
  }

  // Validate addresses
  if (!getValidAddress({ address: inputAddress, chainId: inputChain, withEVMChecksum: true })) {
    throw new Error('Invalid tokenAddress provided within inputCurrencyId')
  }

  if (!getValidAddress({ address: outputAddress, chainId: outputChain, withEVMChecksum: true })) {
    throw new Error('Invalid tokenAddress provided within outputCurrencyId')
  }

  // Validate chain IDs
  if (!ALL_CHAIN_IDS.includes(inputChain)) {
    throw new Error('Invalid inputCurrencyId. Chain ID is not supported')
  }

  if (!ALL_CHAIN_IDS.includes(outputChain)) {
    throw new Error('Invalid outputCurrencyId. Chain ID is not supported')
  }

  // Validate amount
  if (!exactAmountToken || isNaN(Number(exactAmountToken)) || Number(exactAmountToken) < 0) {
    throw new Error('Invalid swap amount')
  }

  // Validate currency field
  if (!currencyField || (currencyField.toLowerCase() !== 'input' && currencyField.toLowerCase() !== 'output')) {
    throw new Error('Invalid currencyField. Must be either `input` or `output`')
  }

  // Validate chain compatibility
  validateSwapChainCompatibility(inputChain, outputChain)

  const exactCurrencyField = currencyField.toLowerCase() === 'output' ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const inputAsset: CurrencyAsset = {
    address: inputAddress,
    chainId: inputChain,
    type: AssetType.Currency,
  }

  const outputAsset: CurrencyAsset = {
    address: outputAddress,
    chainId: outputChain,
    type: AssetType.Currency,
  }

  return {
    inputAsset,
    outputAsset,
    exactCurrencyField,
    exactAmountToken,
  }
}

export function parseSwapLinkWebFormatOrThrow(url: URL): ParsedSwapLinkParams {
  const inputCurrency = url.searchParams.get('inputCurrency') || url.searchParams.get('inputcurrency')
  const outputCurrency = url.searchParams.get('outputCurrency') || url.searchParams.get('outputcurrency')
  const chain = url.searchParams.get('chain')
  const outputChain = url.searchParams.get('outputChain')
  const value = url.searchParams.get('value')
  const field = url.searchParams.get('field')

  // Check if this looks like web format
  if (!inputCurrency && !outputCurrency) {
    throw new Error('Not web format - missing currency parameters')
  }

  const chainData = parseWebChainData(chain, outputChain)
  const addressData = parseWebCurrencyData({ inputCurrency, outputCurrency, chainData })
  const amountData = parseWebAmountData(value, field)

  // Create input asset only if input currency is provided
  const inputAsset: CurrencyAsset | null = addressData.inputAddress
    ? {
        address: addressData.inputAddress,
        chainId: chainData.finalInputChainId,
        type: AssetType.Currency,
      }
    : null

  // Create output asset only if output currency is provided
  const outputAsset: CurrencyAsset | null = addressData.outputAddress
    ? {
        address: addressData.outputAddress,
        chainId: chainData.finalOutputChainId,
        type: AssetType.Currency,
      }
    : null

  return {
    inputAsset,
    outputAsset,
    exactCurrencyField: amountData.exactCurrencyField,
    exactAmountToken: amountData.exactAmountToken,
  }
}

function parseWebChainData(
  chain: string | null,
  outputChain: string | null,
): { finalInputChainId: UniverseChainId; finalOutputChainId: UniverseChainId } {
  const inputChainId = chain ? fromUniswapWebAppLink(chain) : null
  const outputChainId = outputChain ? fromUniswapWebAppLink(outputChain) : null

  if (chain && !inputChainId) {
    throw new Error(`Invalid chain: ${chain}`)
  }

  if (outputChain && !outputChainId) {
    throw new Error(`Invalid outputChain: ${outputChain}`)
  }

  const finalInputChainId = inputChainId ?? UniverseChainId.Mainnet
  const finalOutputChainId = outputChainId ?? finalInputChainId

  // Validate chain compatibility
  validateSwapChainCompatibility(finalInputChainId, finalOutputChainId)

  return { finalInputChainId, finalOutputChainId }
}

interface WebCurrencyDataParams {
  inputCurrency: string | null
  outputCurrency: string | null
  chainData: { finalInputChainId: UniverseChainId; finalOutputChainId: UniverseChainId }
}

function parseWebCurrencyData({ inputCurrency, outputCurrency, chainData }: WebCurrencyDataParams): {
  inputAddress: string | null
  outputAddress: string | null
} {
  const inputAddress = parseCurrencyAddress(inputCurrency, chainData.finalInputChainId)
  const outputAddress = parseCurrencyAddress(outputCurrency, chainData.finalOutputChainId)

  return { inputAddress, outputAddress }
}

function parseWebAmountData(
  value: string | null,
  field: string | null,
): { exactAmountToken: string; exactCurrencyField: CurrencyField } {
  const exactAmountToken = value || '0'
  let exactCurrencyField = CurrencyField.INPUT

  if (field) {
    const fieldUpper = field.toUpperCase()
    if (fieldUpper === 'OUTPUT') {
      exactCurrencyField = CurrencyField.OUTPUT
    } else if (fieldUpper !== 'INPUT') {
      throw new Error('Invalid field. Must be either `INPUT` or `OUTPUT`')
    }
  }

  // Validate amount if provided
  if (value) {
    try {
      const numValue = parseFloat(exactAmountToken)
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Invalid amount value')
      }
    } catch (_error) {
      throw new Error('Invalid swap amount')
    }
  }

  return { exactAmountToken, exactCurrencyField }
}

function parseCurrencyAddress(currency: string | null, chainId: UniverseChainId): string | null {
  if (!currency) {
    return null
  }

  // Handle native currency representations
  if (currency === 'ETH' || currency === 'NATIVE' || currency === 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE') {
    return getNativeAddress(chainId)
  }

  // Validate address format
  if (!getValidAddress({ address: currency, chainId, withEVMChecksum: true })) {
    throw new Error(`Invalid currency address: ${currency}`)
  }

  return currency as string
}
