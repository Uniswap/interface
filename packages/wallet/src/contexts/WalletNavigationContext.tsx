import { createContext, ReactNode, useContext } from 'react'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'

export type NavigateToSwapFlowArgs = { initialState: TransactionState } | undefined

export type WalletNavigationContextState = {
  navigateToAccountTokenList: () => void
  navigateToAccountActivityList: () => void
  navigateToSwapFlow: (args: NavigateToSwapFlowArgs) => void
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
