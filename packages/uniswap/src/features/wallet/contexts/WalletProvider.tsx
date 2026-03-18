import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { WalletService } from 'uniswap/src/features/wallet/services/IWalletService'
import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'
import { HexString } from 'utilities/src/addresses/hex'

interface WalletContext {
  walletService: WalletService
  wallet: Wallet
}

const WalletContext = createContext<WalletContext | undefined>(undefined)

type WalletProviderProps = PropsWithChildren<{
  walletService: WalletService
  evmAddress: HexString | undefined
  svmAddress: string | undefined
}>

export function WalletProvider({ children, walletService, evmAddress, svmAddress }: WalletProviderProps): JSX.Element {
  const contextValue = useMemo(() => {
    const wallet = walletService.getWallet({ evmAddress, svmAddress })
    return { walletService, wallet }
  }, [walletService, evmAddress, svmAddress])

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export function useWalletContext(): WalletContext {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}
