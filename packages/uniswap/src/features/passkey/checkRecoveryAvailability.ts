import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { hashAuthMethodId } from 'uniswap/src/features/passkey/pinCrypto'

/**
 * Probes whether a recovery method (email, OAuth account) is free to be linked
 * to the current Privy user's wallet. Returns `{ available: true }` when the
 * method has no existing recovery binding server-side.
 *
 * The server validates that the caller actually owns `authMethodId` via Privy
 * linkedAccounts, so a stale or unverified identifier surfaces as a thrown
 * error rather than a false negative. Errors propagate to the caller, which
 * owns telemetry for the surrounding flow.
 */
export async function checkRecoveryAvailability({
  identifier,
  accessToken,
}: {
  identifier: string
  accessToken: string
}): Promise<{ available: boolean }> {
  const authMethodId = hashAuthMethodId(identifier)
  const response = await EmbeddedWalletApiClient.fetchCheckRecoveryAvailability({ authMethodId }, accessToken)
  return { available: response.available }
}
