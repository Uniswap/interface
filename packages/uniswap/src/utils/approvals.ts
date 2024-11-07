type ERC20ApprovalTransactionParts = {
  /** The amount approved for spend */
  amount: bigint
  /** The address approved for spend */
  spender: string
}

export function parseERC20ApproveCalldata(data: string): ERC20ApprovalTransactionParts {
  const amount = BigInt(`0x${data.slice(-64)}`) // length of a uint256
  const spender = `0x${data.slice(-104, -64)}` // length of an address

  return { amount, spender }
}
