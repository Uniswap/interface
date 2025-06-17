import { ConnectionProvider } from 'hooks/useConnect'
import React, { ReactNode } from 'react'
import { useWalletCapabilitiesStateEffect } from 'state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'
import { WagmiProvider, type Register } from 'wagmi'

export function createWeb3Provider(params: {
  wagmiConfig: Register['config']
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
