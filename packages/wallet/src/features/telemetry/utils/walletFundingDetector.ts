/**
 * Detects if a wallet has just been funded (transitioned from unfunded to funded)
 * @param wasAlreadyFunded - Whether the wallet was previously marked as funded
 * @param currentTotalBalance - The current total balance across all accounts
 * @returns true if the wallet was just funded, false otherwise
 */
export function isWalletJustFunded({
  wasAlreadyFunded,
  currentTotalBalance,
}: {
  wasAlreadyFunded: boolean
  currentTotalBalance: number
}): boolean {
  return !wasAlreadyFunded && currentTotalBalance > 0
}
