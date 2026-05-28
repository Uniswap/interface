import type { Currency, Token } from '@uniswap/sdk-core'
import type { PriceKey, TokenIdentifier, TokenInput, TokenSubscriptionParams } from '@universe/prices'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
const DEFAULT_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Type guard to check if input is a Currency object (from @uniswap/sdk-core).
 * Currency objects have isNative and isToken properties from the SDK.
 */
export function isCurrency(token: TokenInput): token is Currency {
  return (
    typeof token === 'object' &&
    'chainId' in token &&
    typeof (token as Currency).chainId === 'number' &&
    // Currency from SDK always has isNative property (true for native, false for tokens)
    'isNative' in token &&
    typeof (token as Currency).isNative === 'boolean'
  )
}

/**
 * Type guard to check if input is a TokenIdentifier.
 */
export function isTokenIdentifier(token: TokenInput): token is TokenIdentifier {
  return (
    typeof token === 'object' &&
    'chainId' in token &&
    'address' in token &&
    typeof (token as TokenIdentifier).chainId === 'number' &&
    typeof (token as TokenIdentifier).address === 'string' &&
    !('isNative' in token)
  )
}

/**
 * Normalizes any token input to a TokenIdentifier.
 */
export function normalizeToken(token: TokenInput): TokenIdentifier {
  if (isTokenIdentifier(token)) {
    return {
      chainId: token.chainId,
      address: token.address.toLowerCase(),
    }
  }

  // It's a Currency
  const currency = token as Currency
  if (currency.isNative) {
    return {
      chainId: currency.chainId,
      address: DEFAULT_NATIVE_ADDRESS,
    }
  }

  // It's a Token
  const tokenCurrency = currency as Token
  return {
    chainId: tokenCurrency.chainId,
    address: tokenCurrency.address.toLowerCase(),
  }
}

/**
 * Creates a unique price key from chainId and address.
 * Format matches CurrencyId convention: "chainId-address"
 */
export function createPriceKey(chainId: number, address: string): PriceKey {
  return `${chainId}-${address.toLowerCase()}`
}

/**
 * Creates a price key from a token input.
 */
export function createPriceKeyFromToken(token: TokenInput): PriceKey {
  const { chainId, address } = normalizeToken(token)
  return createPriceKey(chainId, address)
}

/**
 * Parses a price key back to chainId and address.
 * Returns null if the key is malformed (missing chainId or address).
 */
export function parsePriceKey(key: PriceKey): TokenIdentifier | null {
  const [chainIdStr, address] = key.split('-')
  const chainId = Number(chainIdStr)

  if (Number.isNaN(chainId) || !address) {
    return null
  }

  return { chainId, address }
}

/**
 * Converts a TokenIdentifier to the format expected by the subscription API.
 */
export function toSubscriptionParams(token: TokenIdentifier): TokenSubscriptionParams {
  return {
    chainId: token.chainId,
    tokenAddress: token.address.toLowerCase(),
  }
}

/**
 * Filters tokens to only those valid for subscription.
 */
export function filterValidTokens(tokens: TokenInput[]): TokenIdentifier[] {
  return tokens.map(normalizeToken).filter((t) => isEVMAddress(t.address))
}
