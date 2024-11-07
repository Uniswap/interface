import { WalletConnectState } from 'src/features/walletConnect/walletConnectSlice'
import { logger } from 'utilities/src/logger/logger'

export function fetchDappDetails(
  topic: string,
  currentState: Readonly<WalletConnectState>,
): { dappIcon: string | null; dappName: string } {
  try {
    const sessions = Object.values(currentState.byAccount).find((account) => account?.sessions?.[topic])?.sessions

    if (sessions && sessions[topic]) {
      const wcSession = sessions[topic]
      return {
        dappIcon: wcSession?.dapp?.icon || null,
        dappName: wcSession?.dapp?.name || '',
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error retrieving session data'
    logger.warn('walletConnect/saga.ts', 'createDappNotification', message)
  }

  return { dappIcon: null, dappName: '' }
}
