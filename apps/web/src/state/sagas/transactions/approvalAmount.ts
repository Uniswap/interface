/** Parse a decimal approval amount without losing precision for large token balances. */
export function getRequiredApprovalAmount(amount: string): bigint {
  return BigInt(amount)
}
