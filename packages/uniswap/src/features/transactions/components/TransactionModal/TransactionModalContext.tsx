import { Currency } from '@uniswap/sdk-core'
import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import type { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet'
import type { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

export enum TransactionScreen {
  Form = 'Form',
  Review = 'Review',
}

export type SwapRedirectFn = ({
  inputCurrency,
  outputCurrency,
  typedValue,
  independentField,
  chainId,
}: {
  inputCurrency?: Currency
  outputCurrency?: Currency
  typedValue?: string
  independentField?: CurrencyField
  chainId: UniverseChainId
}) => void

export type BiometricsIconProps = {
  color?: string
}

export type TransactionModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  openWalletRestoreModal?: () => void
  walletNeedsRestore?: boolean
  onClose: () => void
  onCurrencyChange?: (selected: { inputCurrency?: Currency; outputCurrency?: Currency }, isBridgePair?: boolean) => void
  renderBiometricsIcon?: (({ color }: BiometricsIconProps) => JSX.Element) | null
  authTrigger?: AuthTrigger
  screen: TransactionScreen
  setScreen: (newScreen: TransactionScreen) => void
  swapRedirectCallback?: SwapRedirectFn
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(undefined)

export function TransactionModalContextProvider({
  children,
  renderBiometricsIcon,
  authTrigger,
  bottomSheetViewStyles,
  onClose,
  onCurrencyChange,
  openWalletRestoreModal,
  walletNeedsRestore,
  screen,
  setScreen,
  swapRedirectCallback,
}: PropsWithChildren<TransactionModalContextState>): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      renderBiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      onCurrencyChange,
      openWalletRestoreModal,
      screen,
      setScreen,
      swapRedirectCallback,
      walletNeedsRestore,
    }),
    [
      renderBiometricsIcon,
      authTrigger,
      bottomSheetViewStyles,
      onClose,
      onCurrencyChange,
      openWalletRestoreModal,
      screen,
      setScreen,
      swapRedirectCallback,
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
