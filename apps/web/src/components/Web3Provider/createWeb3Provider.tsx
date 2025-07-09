import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { ConnectionProvider } from 'hooks/useConnect'
import React, { PropsWithChildren, ReactNode, useMemo } from 'react'
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
    <SolanaProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={reconnectOnMount}>
        <ConnectionProvider>
          {includeCapabilitiesEffects && <WalletCapabilitiesEffects />}
          {children}
        </ConnectionProvider>
      </WagmiProvider>
    </SolanaProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
}

function SolanaProvider({ children }: PropsWithChildren) {
  // WalletProvider has most wallet adapters built in
  const wallets = useMemo(() => [new CoinbaseWalletAdapter()], [])

  return (
    <SolanaWalletProvider wallets={wallets} autoConnect>
      {children}
    </SolanaWalletProvider>
  )
}
