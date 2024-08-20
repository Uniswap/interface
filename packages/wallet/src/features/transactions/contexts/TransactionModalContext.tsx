import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { AuthTrigger } from 'wallet/src/features/auth/types'

export type TransactionModalContextState = {
  account: AccountMeta
  bottomSheetViewStyles: StyleProp<ViewStyle>
  openWalletRestoreModal?: () => void
  walletNeedsRestore?: boolean
  onClose: () => void
  BiometricsIcon?: JSX.Element | null
  authTrigger?: AuthTrigger
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(undefined)

export function TransactionModalContextProvider({
  account,
  children,
  BiometricsIcon,
  authTrigger,
  bottomSheetViewStyles,
  onClose,
  openWalletRestoreModal,
  walletNeedsRestore,
}: PropsWithChildren<TransactionModalContextState>): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      account,
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      openWalletRestoreModal,
      walletNeedsRestore,
    }),
    [BiometricsIcon, account, authTrigger, bottomSheetViewStyles, onClose, openWalletRestoreModal, walletNeedsRestore],
  )

  return <TransactionModalContext.Provider value={state}>{children}</TransactionModalContext.Provider>
}

export const useTransactionModalContext = (): TransactionModalContextState => {
  const context = useContext(TransactionModalContext)

  if (context === undefined) {
    throw new Error('`useTransactionModalContext` must be used inside of `TransactionModalContextProvider`')
  }

  return context
}
