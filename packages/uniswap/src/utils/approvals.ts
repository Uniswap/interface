type ERC20ApprovalTransactionParts = {
  /** The amount approved for spend */
  amount: bigint
  /** The address approved for spend */
  spender: string
}

/** ERC20 approve(address,uint256) selector */
const APPROVE_SELECTOR = '0x095ea7b3'

function padHexToBytes(value: string, bytes: number): string {
  const hex = value.startsWith('0x') ? value.slice(2) : value
  return hex.padStart(bytes * 2, '0')
}

/**
 * Encode calldata for ERC20 approve(spender, amount).
 * Used e.g. for aggregator trades where the spender is the swap contract (methodParameters.to).
 */
export function encodeERC20ApproveCalldata(spender: string, amount: bigint): string {
  const spenderPadded = padHexToBytes(spender, 32)
  const amountPadded = padHexToBytes(amount.toString(16), 32)
  return `${APPROVE_SELECTOR}${spenderPadded}${amountPadded}`
}

export function parseERC20ApproveCalldata(data: string): ERC20ApprovalTransactionParts {
  const amount = BigInt(`0x${data.slice(-64)}`) // length of a uint256
  const spender = `0x${data.slice(-104, -64)}` // length of an address

  return { amount, spender }
}
