// at a minimum, each swap log will contain:
export const MINIMUM_SWAP_LOG_LENGTH =
  // 0x
  2 +
  // (u)int256 input amount
  64 +
  // (u)int256 output amount
  64

/**
 * How many characters of padding we check for getting trimmed off; performance is negligible.
 * Missed balance rate would be (1/16)^TOLERANCE_INDEX
 * Lower = missed balance checks
 * Higher = higher chance that another value enters the output amount threshold (ie we don't return anything)
 */
export const TOLERANCE_INDEX = 4 // 0.0015% of instant balance checks will fail

/**
 *  we assume 256 bits for the slot
 */
export const TOKEN_AMOUNT_SIGNED_HEX_BITS = 256

/**
 * does not include 0x prefix
 */
export const MAX_HEX_STRING_LENGTH = TOKEN_AMOUNT_SIGNED_HEX_BITS / 4

/**
 * blob from an event log data field
 *
 * 0xffffffffffb10b00000000
 *      blob ---^
 */
export interface BlobInfo {
  blobData: string
  isBlobPositive: boolean
  isNextBlobPositive?: boolean
  isFirst?: boolean
  isLast?: boolean
}
