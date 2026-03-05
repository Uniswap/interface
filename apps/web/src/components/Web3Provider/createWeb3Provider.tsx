import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import React, { type PropsWithChildren, type ReactNode, useMemo } from 'react'
import { type Register, WagmiProvider } from 'wagmi'
import { SolanaSignerUpdater } from '~/components/Web3Provider/signSolanaTransaction'
import { useWalletCapabilitiesStateEffect } from '~/state/walletCapabilities/hooks/useWalletCapabilitiesStateEffect'

export function createWeb3Provider(params: { wagmiConfig: Register['config']; reconnectOnMount?: boolean }) {
  const { wagmiConfig, reconnectOnMount = true } = params

  const Provider = ({ children }: { children: ReactNode }) => (
    <SolanaProvider>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={reconnectOnMount}>
        {children}
      </WagmiProvider>
    </SolanaProvider>
  )

  Provider.displayName = 'Web3Provider'

  return Provider
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
