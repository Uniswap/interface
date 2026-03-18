import { IWalletKit, WalletKit } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { registerWCClientForPushNotifications } from 'src/features/walletConnect/api'
import { config } from 'uniswap/src/config'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'

// Export the wallet instance that will be initialized
export let wcWeb3Wallet: IWalletKit

const PROJECT_ID = {
  dev: config.walletConnectProjectIdDev,
  beta: config.walletConnectProjectIdBeta,
  default: config.walletConnectProjectId,
}

let wcWeb3WalletReadyResolve: () => void
let wcWeb3WalletReadyReject: (e: unknown) => void
const wcWeb3WalletReady = new Promise<void>((resolve, reject) => {
  wcWeb3WalletReadyResolve = resolve
  wcWeb3WalletReadyReject = reject
})
export const waitForWcWeb3WalletIsReady = (): Promise<void> => wcWeb3WalletReady

function getProjectId(): string {
  if (isDevEnv()) {
    return PROJECT_ID.dev
  }
  if (isBetaEnv()) {
    return PROJECT_ID.beta
  }
  return PROJECT_ID.default
}

export async function initializeWeb3Wallet(): Promise<void> {
  try {
    const wcCore = new Core({
      projectId: getProjectId(),
    })

    wcWeb3Wallet = await WalletKit.init({
      core: wcCore,
      metadata: {
        name: 'Uniswap Wallet',
        description:
          'Built by the most trusted team in DeFi, Uniswap Wallet allows you to maintain full custody and control of your assets.',
        url: 'https://uniswap.org/app',
        icons: ['https://gateway.pinata.cloud/ipfs/QmR1hYqhDMoyvJtwrQ6f1kVyfEKyK65XH3nbCimXBMkHJg'],
        redirect: {
          native: 'uniswap://',
          universal: 'https://uniswap.org/app',
          linkMode: true,
        },
      },
    })

    const clientId = await wcWeb3Wallet.engine.signClient.core.crypto.getClientId()
    await registerWCClientForPushNotifications(clientId)
    wcWeb3WalletReadyResolve()
  } catch (e) {
    logger.error(e, {
      tags: { file: 'walletConnect/walletConnectClient', function: 'initializeWeb3Wallet' },
    })
    wcWeb3WalletReadyReject(e)
  }
}
