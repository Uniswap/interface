import { useWallet as useSolanaWalletContext } from '@solana/wallet-adapter-react'
import { PropsWithChildren, useMemo } from 'react'
import { WalletProvider } from 'uniswap/src/features/wallet/contexts/WalletProvider'
import { createWalletService } from 'uniswap/src/features/wallet/services/createWalletService'
import { useAccount } from '~/connection/hooks/useAccount'
import { getExternalEVMWalletService } from '~/connection/services/ExternalEVMWalletService'
import { useExternalSVMWalletService } from '~/connection/services/ExternalSVMWalletService'

export function ExternalWalletProvider({ children }: PropsWithChildren): JSX.Element {
  const evmAccountAddress = useAccount().address

  const svmAccountAddress = useSolanaWalletContext().wallet?.adapter.publicKey?.toString() // toString is equal to toBase58

  const svmWalletService = useExternalSVMWalletService()
  const walletService = useMemo(
    () =>
      createWalletService({
        evmWalletService: getExternalEVMWalletService(),
        svmWalletService,
      }),
    [svmWalletService],
  )

  return (
    <WalletProvider walletService={walletService} evmAddress={evmAccountAddress} svmAddress={svmAccountAddress}>
      {children}
    </WalletProvider>
  )
}
