const ONE_YEAR_IN_SECONDS = 31536000

/**
 * Detects potential deadline timestamps in transaction calldata to assess
 * if the transaction is likely a bridge transaction when receiving a
 * the TX as a DAPP request by checking for multiple potential timestamps.
 * This is not a guarantee but does not require making any api calls.
 */
export function detectIfMaybeBridgeTransaction(calldata?: string): boolean {
  if (!calldata) {
    return false
  }

  const data = calldata.startsWith('0x') ? calldata.slice(2) : calldata

  const deadlines: number[] = []
  const now = Date.now() / 1000

  // Scan every 8 hex chars (4 bytes) for potential timestamps
  for (let i = 0; i <= data.length - 8; i += 2) {
    const hex = data.slice(i, i + 8)
    const value = parseInt(hex, 16)

    if (value > now && value < now + ONE_YEAR_IN_SECONDS) {
      if (!deadlines.includes(value)) {
        deadlines.push(value)
      }
    }
  }

  // Also check 32-byte aligned values (last 4 bytes of each 32-byte word)
  // This catches uint256 parameters that are timestamps
  for (let i = 0; i <= data.length - 64; i += 64) {
    // Read the last 4 bytes (8 hex chars) of the 32-byte word
    const hex = data.slice(i + 56, i + 64)
    const value = parseInt(hex, 16)

    if (value > now && value < now + ONE_YEAR_IN_SECONDS) {
      if (!deadlines.includes(value)) {
        deadlines.push(value)
      }
    }
  }

  return deadlines.length >= 2
}
