import { WalletProvider } from '@solana/wallet-adapter-react'
import { FC, ReactNode, useMemo } from 'react'

import { SUPPORTED_WALLETS } from 'constants/wallets'
import { isSolanaWallet } from 'utils'

const SolanaWalletContext: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () =>
      Object.values(SUPPORTED_WALLETS)
        .filter(isSolanaWallet)
        .map(wallet => wallet.adapter),
    [],
  )

  return (
    <WalletProvider wallets={wallets} autoConnect>
      {children}
    </WalletProvider>
  )
}

export default SolanaWalletContext
