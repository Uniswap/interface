import { getExternalEVMWalletService } from 'features/wallet/services/ExternalEVMWalletService'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useMemo } from 'react'
import { WalletProvider } from 'uniswap/src/features/wallet/contexts/WalletProvider'

export function ExternalWalletProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccount()

  const walletService = useMemo(() => getExternalEVMWalletService(), [])

  return (
    <WalletProvider walletService={walletService} evmAddress={account.address}>
      {children}
    </WalletProvider>
  )
}
