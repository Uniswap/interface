import { createContext, ReactNode, useContext, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { AuthTrigger } from 'wallet/src/features/auth/types'

export type TransactionModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  openWalletRestoreModal?: () => void
  walletNeedsRestore?: boolean
  onClose: () => void
  BiometricsIcon?: JSX.Element | null
  authTrigger?: AuthTrigger
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(
  undefined
)

export function TransactionModalContextProvider({
  children,
  BiometricsIcon,
  authTrigger,
  bottomSheetViewStyles,
  onClose,
  openWalletRestoreModal,
  walletNeedsRestore,
}: {
  children: ReactNode
  BiometricsIcon?: TransactionModalContextState['BiometricsIcon']
  authTrigger?: TransactionModalContextState['authTrigger']
  bottomSheetViewStyles: TransactionModalContextState['bottomSheetViewStyles']
  onClose: () => void
  openWalletRestoreModal?: TransactionModalContextState['openWalletRestoreModal']
  walletNeedsRestore?: TransactionModalContextState['walletNeedsRestore']
}): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      openWalletRestoreModal,
      walletNeedsRestore,
    }),
    [
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      openWalletRestoreModal,
      walletNeedsRestore,
    ]
  )

  return (
    <TransactionModalContext.Provider value={state}>{children}</TransactionModalContext.Provider>
  )
}

export const useTransactionModalContext = (): TransactionModalContextState => {
  const context = useContext(TransactionModalContext)

  if (context === undefined) {
    throw new Error(
      '`useTransactionModalContext` must be used inside of `TransactionModalContextProvider`'
    )
  }

  return context
}
