import { MaxUint256 } from '@juiceswapxyz/sdk-core'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// ERC20 approve function signature: approve(address,uint256)
const ERC20_APPROVE_SELECTOR = '0x095ea7b3'

// Common spender addresses for different routing types
const SPENDER_ADDRESSES = {
  // Permit2 address - used for most UniswapX and some classic swaps
  PERMIT2: PERMIT2_ADDRESS,

  // Universal Router addresses by chain (these would need to be populated with actual addresses)
  UNIVERSAL_ROUTER: {
    [UniverseChainId.Sepolia]: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    // Add other chains as needed
  } as Record<UniverseChainId, string>,

  // V3 SwapRouter addresses by chain
  V3_SWAP_ROUTER: {
    [UniverseChainId.Sepolia]: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    // Add other chains as needed
  } as Record<UniverseChainId, string>,
} as const

/**
 * Determines the appropriate spender address for classic swaps
 * Based on the example response, even classic swaps use Permit2 as the spender
 */
export function getSpenderAddress(routing: Routing | undefined, _chainId: UniverseChainId): string {
  // For classic swaps, based on the example response, use Permit2
  if (routing === Routing.CLASSIC) {
    // The example response shows Permit2 is used even for classic swaps
    return SPENDER_ADDRESSES.PERMIT2
  }

  // For any other routing type, default to Permit2
  return SPENDER_ADDRESSES.PERMIT2
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
  // Remove 0x prefix if present
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address
  // Pad with zeros to 64 characters
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
  // Ensure spender is a valid address
  if (!spender || !spender.startsWith('0x') || spender.length !== 42) {
    throw new Error(`Invalid spender address: ${spender}`)
  }

  // Convert amount to bigint for consistent handling
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount)

  // Construct the calldata
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
    // Check if it starts with the approve selector
    if (!calldata.startsWith(ERC20_APPROVE_SELECTOR)) {
      return {
        isValid: false,
        error: 'Invalid function selector',
      }
    }

    // Check total length (0x + selector + 2 * 32 bytes = 2 + 4 + 64 + 64 = 134 characters)
    // But actual length is 138, so let's check for the correct length
    if (calldata.length !== 138) {
      return {
        isValid: false,
        error: 'Invalid calldata length',
      }
    }

    // Extract spender and amount
    const spenderHex = calldata.slice(10, 74) // Skip selector (4) + 32 bytes (64)
    const amountHex = calldata.slice(74, 138) // Next 32 bytes (64)

    const spender = `0x${spenderHex.slice(-40)}` // Last 20 bytes (40 hex chars)
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
