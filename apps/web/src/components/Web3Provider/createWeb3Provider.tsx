import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import React, { type PropsWithChildren, type ReactNode, useEffect, useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { type Register, WagmiProvider } from 'wagmi'
import { reconnect } from 'wagmi/actions'
import { useRecentConnectorId } from '~/connection/constants'
import { getConnectorsToReconnect, settleMountReconnect } from '~/connection/mountReconnect'
import { SolanaSignerUpdater } from '~/connection/signSolanaTransaction'
import { useWalletCapabilitiesStateEffect } from '~/state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'
import { isIFramed } from '~/utils/isIFramed'

export function createWeb3Provider(params: { wagmiConfig: Register['config']; reconnectOnMount?: boolean }) {
  const { wagmiConfig, reconnectOnMount = true } = params

  const Provider = ({ children }: { children: ReactNode }) => (
    <SolanaProvider>
      {/* reconnectOnMount would reconnect any connector whose isAuthorized() probe passes, which for
          injected wallets survives "clear site data" (INFRA-2902); drive reconnection ourselves instead. */}
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        {reconnectOnMount && <IntentionalEvmReconnect config={wagmiConfig} />}
        {children}
      </WagmiProvider>
    </SolanaProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
}

// Reconnects only the connectors we intentionally want restored on mount (see getConnectorsToReconnect).
function IntentionalEvmReconnect({ config }: { config: Register['config'] }): null {
  const recentConnectorId = useRecentConnectorId()
  useEffect(() => {
    const connectors = getConnectorsToReconnect({
      recentConnectorId,
      isIframe: isIFramed(),
      connectors: config.connectors,
    })
    if (connectors.length === 0) {
      settleMountReconnect()
      return
    }
    reconnect(config, { connectors })
      .catch((error: unknown) => {
        logger.warn('createWeb3Provider', 'IntentionalEvmReconnect', 'Mount reconnect failed', { error })
      })
      .finally(settleMountReconnect)
    // Run once on mount; recentConnectorId is rewritten after a successful reconnect and must not retrigger this.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- run-once on mount
  }, [])
  return null
}

function SolanaProvider({ children }: PropsWithChildren) {
  // WalletProvider has built-in support for SolanaStandard wallets;
  const wallets = useMemo(() => [new CoinbaseWalletAdapter()], [])

  return (
    <SolanaWalletProvider wallets={wallets} autoConnect>
      <SolanaSignerUpdater />
      {children}
    </SolanaWalletProvider>
  )
}

export function WalletCapabilitiesEffects() {
  useWalletCapabilitiesStateEffect()
  return null
}
