import { MaxUint256 } from '@juiceswapxyz/sdk-core'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ERC20_APPROVE_SELECTOR = '0x095ea7b3'

const SPENDER_ADDRESSES = {
  PERMIT2: PERMIT2_ADDRESS,

  UNIVERSAL_ROUTER: {
    [UniverseChainId.Sepolia]: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
  } as Record<UniverseChainId, string>,

  V3_SWAP_ROUTER: {
    [UniverseChainId.Sepolia]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    [UniverseChainId.CitreaTestnet]: '0x610c98EAD0df13EA906854b6041122e8A8D14413',
    // Add other chains as needed
  } as Record<UniverseChainId, string>,
} as const

/**
 * Determines the appropriate spender address for classic swaps
 * Based on the example response, even classic swaps use Permit2 as the spender
 */
export function getSpenderAddress(_chainId: UniverseChainId): string {
  return SPENDER_ADDRESSES.V3_SWAP_ROUTER[_chainId]
}

/**
 * Gets the spender address specifically for classic swaps
 * Based on the example response, classic swaps use Permit2
 */
export function getClassicSwapSpenderAddress(_chainId: UniverseChainId): string {
  return SPENDER_ADDRESSES.PERMIT2
}

/**
 * Pads an address to 32 bytes (64 hex characters)
 */
function padAddress(address: string): string {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
  return cleanAddress.padStart(64, '0')
}

/**
 * Pads a number to 32 bytes (64 hex characters)
 */
function padNumber(value: string | bigint): string {
  const hexValue = typeof value === 'bigint' ? value.toString(16) : BigInt(value).toString(16)
  return hexValue.padStart(64, '0')
}

/**
 * Constructs ERC20 approve calldata
 * @param spender - The address to approve for spending
 * @param amount - The amount to approve (use MaxUint256.toString() for unlimited)
 * @returns The complete calldata string
 */
export function constructERC20ApproveCalldata(spender: string, amount: string | bigint): string {
  if (!spender || !spender.startsWith('0x') || spender.length !== 42) {
    throw new Error(`Invalid spender address: ${spender}`)
  }

  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount)

  const paddedSpender = padAddress(spender)
  const paddedAmount = padNumber(amountBigInt)

  return `${ERC20_APPROVE_SELECTOR}${paddedSpender}${paddedAmount}`
}

/**
 * Constructs ERC20 approve calldata for unlimited approval
 * @param spender - The address to approve for spending
 * @returns The complete calldata string for unlimited approval
 */
export function constructUnlimitedERC20ApproveCalldata(spender: string): string {
  return constructERC20ApproveCalldata(spender, MaxUint256.toString())
}

/**
 * Validates that a calldata string is a valid ERC20 approve call
 * @param calldata - The calldata to validate
 * @returns Object with validation result and parsed data if valid
 */
export function validateERC20ApproveCalldata(calldata: string): {
  isValid: boolean
  spender?: string
  amount?: string
  error?: string
} {
  try {
    if (!calldata.startsWith(ERC20_APPROVE_SELECTOR)) {
      return {
        isValid: false,
        error: 'Invalid function selector',
      }
    }

    if (calldata.length !== 138) {
      return {
        isValid: false,
        error: 'Invalid calldata length',
      }
    }

    const spenderHex = calldata.slice(10, 74)
    const amountHex = calldata.slice(74, 138)

    const spender = `0x${spenderHex.slice(-40)}`
    const amount = BigInt(`0x${amountHex}`).toString()

    return {
      isValid: true,
      spender,
      amount,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
