import { createContext, ReactNode, useContext, useMemo } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'

export type TransactionModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  handleContentLayout: (event: LayoutChangeEvent) => void
  openWalletRestoreModal?: () => void
  walletNeedsRestore?: boolean
  onClose: () => void
  BiometricsIcon?: JSX.Element | null
  authTrigger?: (args: {
    successCallback: () => void
    failureCallback: () => void
  }) => Promise<void>
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(
  undefined
)

export function TransactionModalContextProvider({
  children,
  BiometricsIcon,
  authTrigger,
  bottomSheetViewStyles,
  handleContentLayout,
  onClose,
  openWalletRestoreModal,
  walletNeedsRestore,
}: {
  children: ReactNode
  BiometricsIcon?: TransactionModalContextState['BiometricsIcon']
  authTrigger?: TransactionModalContextState['authTrigger']
  bottomSheetViewStyles: TransactionModalContextState['bottomSheetViewStyles']
  handleContentLayout: TransactionModalContextState['handleContentLayout']
  onClose: () => void
  openWalletRestoreModal?: TransactionModalContextState['openWalletRestoreModal']
  walletNeedsRestore?: TransactionModalContextState['walletNeedsRestore']
}): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      handleContentLayout,
      onClose,
      openWalletRestoreModal,
      walletNeedsRestore,
    }),
    [
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      handleContentLayout,
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
