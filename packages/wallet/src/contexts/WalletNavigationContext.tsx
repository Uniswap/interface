import { createContext, ReactNode, useContext } from 'react'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'

export type NavigateToSwapFlowArgs = { initialState: TransactionState } | undefined

export type NavigateToNftItemArgs = {
  owner?: Address
  address: Address
  tokenId: string
  isSpam?: boolean
  fallbackData?: NFTItem
}

export type WalletNavigationContextState = {
  navigateToAccountActivityList: () => void
  navigateToAccountTokenList: () => void
  // Action that should be taken when the user presses the "Buy crypto" or "Receive tokens" button when they open the Send flow with an empty wallet.
  navigateToBuyOrReceiveWithEmptyWallet: () => void
  navigateToNftDetails: (args: NavigateToNftItemArgs) => void
  navigateToSwapFlow: (args: NavigateToSwapFlowArgs) => void
  navigateToTokenDetails: (currencyId: string) => void
}

export const WalletNavigationContext = createContext<WalletNavigationContextState | undefined>(
  undefined
)

export function WalletNavigationProvider({
  children,
  ...props
}: {
  children: ReactNode
} & WalletNavigationContextState): JSX.Element {
  return (
    <WalletNavigationContext.Provider value={props}>{children}</WalletNavigationContext.Provider>
  )
}

export const useWalletNavigation = (): WalletNavigationContextState => {
  const walletNavigationContext = useContext(WalletNavigationContext)

  if (walletNavigationContext === undefined) {
    throw new Error('`useWalletNavigation` must be used inside of `WalletNavigationProvider`')
  }

  return walletNavigationContext
}
