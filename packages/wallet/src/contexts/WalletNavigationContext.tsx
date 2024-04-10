import { createContext, ReactNode, useContext } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { getSwapPrefilledState } from 'wallet/src/features/transactions/swap/hooks/useSwapPrefilledState'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'

type NavigateToSwapFlowTransactionState = {
  initialState: TransactionState
}

type NavigateToSwapFlowPartialState = {
  currencyField: CurrencyField
  currencyAddress: Address
  currencyChainId: ChainId
}

export type NavigateToSwapFlowArgs =
  // Depending on how much control you need, you can either pass a complete `TransactionState` object or just the currency, address and chain.
  NavigateToSwapFlowTransactionState | NavigateToSwapFlowPartialState | undefined

function isNavigateToSwapFlowArgsInitialState(
  args: NavigateToSwapFlowArgs
): args is NavigateToSwapFlowTransactionState {
  return Boolean(args && (args as NavigateToSwapFlowTransactionState).initialState !== undefined)
}

function isNavigateToSwapFlowArgsPartialState(
  args: NavigateToSwapFlowArgs
): args is NavigateToSwapFlowPartialState {
  return Boolean(args && (args as NavigateToSwapFlowPartialState).currencyAddress !== undefined)
}

export function getNavigateToSwapFlowArgsInitialState(
  args: NavigateToSwapFlowArgs
): TransactionState | undefined {
  return isNavigateToSwapFlowArgsInitialState(args)
    ? args.initialState
    : isNavigateToSwapFlowArgsPartialState(args)
    ? getSwapPrefilledState(args)
    : undefined
}

export type NavigateToNftItemArgs = {
  owner?: Address
  address: Address
  tokenId: string
  isSpam?: boolean
  fallbackData?: NFTItem
}

export type NavigateToSendArgs =
  | {
      chainId: ChainId
      currencyAddress: Address
    }
  | undefined

export type ShareTokenArgs = {
  currencyId: string
}

export type ShareNftArgs = {
  contractAddress: string
  tokenId: string
}

export type WalletNavigationContextState = {
  navigateToAccountActivityList: () => void
  navigateToAccountTokenList: () => void
  // Action that should be taken when the user presses the "Buy crypto" or "Receive tokens" button when they open the Send flow with an empty wallet.
  navigateToBuyOrReceiveWithEmptyWallet: () => void
  navigateToNftDetails: (args: NavigateToNftItemArgs) => void
  navigateToSwapFlow: (args: NavigateToSwapFlowArgs) => void
  navigateToTokenDetails: (currencyId: string) => void
  navigateToReceive: () => void
  navigateToSend: (args: NavigateToSendArgs) => void
  handleShareNft: (args: ShareNftArgs) => void
  handleShareToken: (args: ShareTokenArgs) => void
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
