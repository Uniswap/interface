import React, { ReactNode } from 'react'
import type { Config } from 'wagmi'
import { WagmiProvider } from 'wagmi'

import { ConnectionProvider } from 'hooks/useConnect'
import { useWalletCapabilitiesStateEffect } from 'state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'

export function createWeb3Provider(params: {
  wagmiConfig: Config
  reconnectOnMount?: boolean
  includeCapabilitiesEffects?: boolean
}) {
  const { wagmiConfig, reconnectOnMount = true, includeCapabilitiesEffects = true } = params

  const WalletCapabilitiesEffects: React.FC = () => {
    useWalletCapabilitiesStateEffect()
    return null
  }

  const Provider = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={reconnectOnMount}>
      <ConnectionProvider>
        {includeCapabilitiesEffects && <WalletCapabilitiesEffects />}
        {children}
      </ConnectionProvider>
    </WagmiProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
}
