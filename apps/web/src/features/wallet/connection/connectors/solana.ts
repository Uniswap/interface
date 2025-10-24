import { WalletError } from '@solana/wallet-adapter-base'
import { useWallet as useSolanaWalletContext } from '@solana/wallet-adapter-react'
import type { ExternalConnector } from 'features/accounts/store/types'
import type { GetConnectorFn } from 'features/wallet/connection/services/createConnectionService'
import { createConnectionService } from 'features/wallet/connection/services/createConnectionService'
import type { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { useMemo } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useEvent } from 'utilities/src/react/hooks'
import { sleep } from 'utilities/src/time/timing'

export function useSolanaConnectionService(getConnector: GetConnectorFn): ConnectionService {
  const solanaWalletContext = useSolanaWalletContext()

  const activateConnector = useEvent(async (connector: ExternalConnector<Platform.SVM>) => {
    const adapter = solanaWalletContext.wallets
      .map((wallet) => wallet.adapter)
      .find(({ name }) => name === connector.externalLibraryId)

    if (!adapter) {
      throw new Error(`Solana Wallet Adapter not found for wallet ${connector.externalLibraryId}`)
    }

    // adapter.connect() immediately resolves regardless of user input; we form a promise around
    // the connect and error events in order to actually detect user acceptance or rejection
    let connectHandler = () => {}
    let errorHandler = (_error: WalletError) => {}

    const promise = new Promise((resolve, reject) => {
      connectHandler = () => resolve(undefined)
      errorHandler = (error: WalletError) => reject(error)
      adapter.addListener('connect', connectHandler)
      adapter.addListener('error', errorHandler)
    })

    try {
      solanaWalletContext.select(connector.externalLibraryId)
      // TODO(WEB-8126): Investigate why this is needed
      // adapter.connect() can throw an error if called too soon after solanaWalletContext.select()
      await sleep(10)
      await adapter.connect()

      await promise
    } finally {
      adapter.removeListener('connect', connectHandler)
      adapter.removeListener('error', errorHandler)
    }
  })

  return useMemo(
    () =>
      createConnectionService({
        platform: Platform.SVM,
        getConnector,
        activateConnector,
      }),
    [activateConnector, getConnector],
  )
}
