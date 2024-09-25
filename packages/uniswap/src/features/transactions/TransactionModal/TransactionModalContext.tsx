import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
/* eslint-disable no-restricted-imports */
import type { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet'
import type { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes'
import { AuthTrigger } from 'uniswap/src/features/auth/types'

export enum TransactionScreen {
  Form = 'Form',
  Review = 'Review',
}

export type TransactionModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  openWalletRestoreModal?: () => void
  walletNeedsRestore?: boolean
  onClose: () => void
  BiometricsIcon?: JSX.Element | null
  authTrigger?: AuthTrigger
  screen: TransactionScreen
  setScreen: (newScreen: TransactionScreen) => void
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(undefined)

export function TransactionModalContextProvider({
  children,
  BiometricsIcon,
  authTrigger,
  bottomSheetViewStyles,
  onClose,
  openWalletRestoreModal,
  walletNeedsRestore,
  screen,
  setScreen,
}: PropsWithChildren<TransactionModalContextState>): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      openWalletRestoreModal,
      screen,
      setScreen,
      walletNeedsRestore,
    }),
    [
      BiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      openWalletRestoreModal,
      screen,
      setScreen,
      walletNeedsRestore,
    ],
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
