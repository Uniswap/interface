import { createContext, ReactNode, useContext } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { getSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { getSendPrefilledState } from 'wallet/src/features/transactions/send/getSendPrefilledState'

type NavigateToTransactionFlowTransactionState = {
  initialState: TransactionState
}

type NavigateToSwapFlowPartialState = {
  currencyField: CurrencyField
  currencyAddress: Address
  currencyChainId: UniverseChainId
}

type NavigateToSwapFlowWithActions = {
  openTokenSelector: CurrencyField
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
}

type NavigateToSendFlowPartialState = {
  chainId: UniverseChainId
  currencyAddress?: Address
}

export type NavigateToSwapFlowArgs =
  // Depending on how much control you need, you can either pass a complete `TransactionState` object or just the currency, address and chain.
  NavigateToTransactionFlowTransactionState | NavigateToSwapFlowPartialState | NavigateToSwapFlowWithActions | undefined

// Same as above, but for send flow
export type NavigateToSendFlowArgs =
  | NavigateToTransactionFlowTransactionState
  | NavigateToSendFlowPartialState
  | undefined

function isNavigateToTransactionFlowArgsInitialState(
  args: NavigateToSwapFlowArgs | NavigateToSendFlowArgs,
): args is NavigateToTransactionFlowTransactionState {
  return Boolean(args && (args as NavigateToTransactionFlowTransactionState).initialState !== undefined)
}

export function isNavigateToSwapFlowArgsPartialState(
  args: NavigateToSwapFlowArgs,
): args is NavigateToSwapFlowPartialState {
  return Boolean(args && (args as NavigateToSwapFlowPartialState).currencyAddress !== undefined)
}

function isNavigateToSwapFlowWithActions(args: NavigateToSwapFlowArgs): args is NavigateToSwapFlowWithActions {
  return Boolean(args && (args as NavigateToSwapFlowWithActions).openTokenSelector !== undefined)
}

function isNavigateToSendFlowArgsPartialState(args: NavigateToSendFlowArgs): args is NavigateToSendFlowPartialState {
  return Boolean(args && (args as NavigateToSendFlowPartialState).chainId !== undefined)
}

export function getNavigateToSwapFlowArgsInitialState(
  args: NavigateToSwapFlowArgs,
  defaultChainId: UniverseChainId,
): TransactionState | undefined {
  if (isNavigateToTransactionFlowArgsInitialState(args)) {
    return args.initialState
  } else if (isNavigateToSwapFlowArgsPartialState(args)) {
    return getSwapPrefilledState(args) as TransactionState
  } else if (isNavigateToSwapFlowWithActions(args)) {
    const inputChainId = args.inputChainId ?? defaultChainId
    return {
      [CurrencyField.INPUT]: {
        address: getNativeAddress(inputChainId),
        chainId: inputChainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      selectingCurrencyField: CurrencyField.OUTPUT,
      selectingCurrencyChainId: args.outputChainId,
    }
  } else {
    return undefined
  }
}

export function getNavigateToSendFlowArgsInitialState(args: NavigateToSendFlowArgs): TransactionState | undefined {
  return isNavigateToTransactionFlowArgsInitialState(args)
    ? args.initialState
    : isNavigateToSendFlowArgsPartialState(args)
      ? getSendPrefilledState(args)
      : undefined
}

export type NavigateToNftItemArgs = {
  owner?: Address
  address: Address
  tokenId: string
  chainId?: UniverseChainId
  isSpam?: boolean
  fallbackData?: NFTItem
}

export type NavigateToNftCollectionArgs = {
  collectionAddress: Address
}

export type NavigateToFiatOnRampArgs = {
  prefilledCurrency?: FiatOnRampCurrency
  isOfframp?: boolean
}

export type NavigateToExternalProfileArgs = {
  address: Address
}

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
  navigateToExternalProfile: (args: NavigateToExternalProfileArgs) => void
  navigateToFiatOnRamp: (args: NavigateToFiatOnRampArgs) => void
  navigateToNftDetails: (args: NavigateToNftItemArgs) => void
  navigateToNftCollection: (args: NavigateToNftCollectionArgs) => void
  navigateToSwapFlow: (args: NavigateToSwapFlowArgs) => void
  navigateToTokenDetails: (currencyId: string) => void
  navigateToReceive: () => void
  navigateToSend: (args: NavigateToSendFlowArgs) => void
  handleShareNft: (args: ShareNftArgs) => void
  handleShareToken: (args: ShareTokenArgs) => void
}

export const WalletNavigationContext = createContext<WalletNavigationContextState | undefined>(undefined)

export function WalletNavigationProvider({
  children,
  ...props
}: {
  children: ReactNode
} & WalletNavigationContextState): JSX.Element {
  return <WalletNavigationContext.Provider value={props}>{children}</WalletNavigationContext.Provider>
}

export const useWalletNavigation = (): WalletNavigationContextState => {
  const walletNavigationContext = useContext(WalletNavigationContext)

  if (walletNavigationContext === undefined) {
    throw new Error('`useWalletNavigation` must be used inside of `WalletNavigationProvider`')
  }

  return walletNavigationContext
}
