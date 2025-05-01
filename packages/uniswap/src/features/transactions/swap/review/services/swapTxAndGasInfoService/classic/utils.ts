import { isInterface } from 'utilities/src/platform'

export function getShouldPresignPermits(): boolean {
  // In environments that can sign typed data without UI prompts (e.g., mobile / ext),
  // we can sign permits when preparing SwapTxAndGasInfo, which allows earlier access to
  // calldata / simulation results. In dapp environments (interface), if a permit is required,
  // signing and calldata fetching are deferred to the swap execution phase.
  return !isInterface
}
