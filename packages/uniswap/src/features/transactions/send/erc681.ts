import { formatUnits } from '@ethersproject/units'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'

export interface ERC681TransferRequest {
  chainId: UniverseChainId
  recipient: string
  tokenAddress?: string // Present if ERC-20 token transfer, undefined if native currency transfer
  rawAmount?: string // The atomic unit integer string (in Wei or tokens' smallest unit)
  formattedAmount?: string // Human-readable amount (for native ETH transfers where decimals is 18)
}

/**
 * Converts scientific notation strings (e.g. "2.014e18", "1e16"), hex ("0xde0b6b3a7640000"), or integer strings ("1000000")
 * into precision-safe standard decimal integer strings.
 */
export function parseScientificOrIntString(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    // Handle hex format
    if (trimmed.toLowerCase().startsWith('0x')) {
      return BigInt(trimmed).toString()
    }

    // Handle scientific notation (e.g., 2.014e18 or 1e16)
    if (trimmed.toLowerCase().includes('e')) {
      const parts = trimmed.toLowerCase().split('e')
      if (parts.length !== 2) {
        return undefined
      }

      const baseStr = parts[0]
      const expStr = parts[1]
      if (!baseStr || !expStr) {
        return undefined
      }

      const exp = parseInt(expStr, 10)
      if (isNaN(exp) || exp < 0) {
        return undefined
      }

      const baseParts = baseStr.split('.')
      const integerPart = baseParts[0] || '0'
      const fractionalPart = baseParts[1] || ''

      if (fractionalPart.length > exp) {
        // Underflow / fractional remainder in atomic units is invalid in EIP-681 integer parameters
        return undefined
      }

      const combined = (integerPart === '0' ? '' : integerPart) + fractionalPart
      const trailingZeros = '0'.repeat(exp - fractionalPart.length)
      const resultString = combined + trailingZeros

      return BigInt(resultString.length === 0 ? '0' : resultString).toString()
    }

    // Standard decimal string (remove any trailing ".00" if present)
    const normalized = trimmed.includes('.') ? trimmed.split('.')[0] : trimmed
    if (!normalized) {
      return undefined
    }
    return BigInt(normalized).toString()
  } catch (error) {
    logger.debug('erc681', 'parseScientificOrIntString', `Failed to parse numerical value: ${value}`, { error })
    return undefined
  }
}

/**
 * Formats a raw atomic token amount using token decimals, cleanly removing trailing ".0" or excess zeros.
 */
export function formatERC681Amount(rawAmount?: string, decimals: number = 18): string | undefined {
  if (!rawAmount) {
    return undefined
  }
  try {
    const formatted = formatUnits(rawAmount, decimals)
    if (formatted.includes('.')) {
      // Clean up trailing zeros after decimal point and trailing dot (e.g. "1.0" -> "1", "2.01400" -> "2.014")
      return formatted.replace(/0+$/, '').replace(/\.$/, '')
    }
    return formatted
  } catch {
    return undefined
  }
}

/**
 * Parses an EIP-681 Ethereum URI into a structured transfer request for Native ETH or ERC-20 transfers.
 * Syntax specification: ethereum:<target_address>[@<chain_id>][/<function_name>][?<query_parameters>]
 */
export function parseERC681URI(uri?: string): ERC681TransferRequest | undefined {
  if (!uri || !uri.toLowerCase().startsWith('ethereum:')) {
    return undefined
  }

  try {
    const withoutScheme = uri.slice(9).trim()
    const queryIndex = withoutScheme.indexOf('?')

    const pathPart = queryIndex !== -1 ? withoutScheme.slice(0, queryIndex) : withoutScheme
    const queryPart = queryIndex !== -1 ? withoutScheme.slice(queryIndex + 1) : ''

    const slashIndex = pathPart.indexOf('/')
    const targetAndChain = slashIndex !== -1 ? pathPart.slice(0, slashIndex) : pathPart
    const functionName = slashIndex !== -1 ? pathPart.slice(slashIndex + 1).trim() : undefined

    const atIndex = targetAndChain.indexOf('@')
    const rawAddress = atIndex !== -1 ? targetAndChain.slice(0, atIndex) : targetAndChain
    const rawChainId = atIndex !== -1 ? parseInt(targetAndChain.slice(atIndex + 1), 10) : NaN

    const targetAddress = getValidAddress({
      address: rawAddress,
      platform: Platform.EVM,
      withEVMChecksum: true,
      log: false,
    })
    if (!targetAddress) {
      return undefined
    }

    const chainId = (!isNaN(rawChainId) && rawChainId > 0 ? rawChainId : UniverseChainId.Mainnet) as UniverseChainId
    const searchParams = new URLSearchParams(queryPart)

    // Case 1: Native currency transfer (no function specified, or explicit "pay" function)
    if (!functionName || functionName.toLowerCase() === 'pay') {
      const valueParam = searchParams.get('value')
      const rawAmount = parseScientificOrIntString(valueParam)
      const formattedAmount = formatERC681Amount(rawAmount, 18)

      return {
        chainId,
        recipient: targetAddress,
        tokenAddress: undefined,
        rawAmount,
        formattedAmount,
      }
    }

    // Case 2: ERC-20 token transfer (function_name == "transfer")
    if (functionName === 'transfer') {
      const recipientParam = searchParams.get('address')
      if (!recipientParam) {
        return undefined
      }

      const recipient = getValidAddress({
        address: recipientParam,
        platform: Platform.EVM,
        withEVMChecksum: true,
        log: false,
      })
      if (!recipient) {
        return undefined
      }

      const amountParam = searchParams.get('uint256') ?? searchParams.get('value')
      const rawAmount = parseScientificOrIntString(amountParam)

      return {
        chainId,
        recipient,
        tokenAddress: targetAddress,
        rawAmount,
      }
    }

    // Ignore unsupported smart contract execution function calls per safety guidance
    return undefined
  } catch (error) {
    logger.error('Failed to parse ERC-681 URI', {
      tags: { file: 'erc681.ts', function: 'parseERC681URI' },
      extra: { uri, error },
    })
    return undefined
  }
}
