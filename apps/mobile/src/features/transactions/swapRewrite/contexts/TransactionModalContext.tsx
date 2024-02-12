import { createContext, ReactNode, useContext, useMemo } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'

type TransactionModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  handleContentLayout: (event: LayoutChangeEvent) => void
}

export const TransactionModalContext = createContext<TransactionModalContextState | undefined>(
  undefined
)

export function TransactionModalContextProvider({
  children,
  bottomSheetViewStyles,
  handleContentLayout,
}: {
  children: ReactNode
  bottomSheetViewStyles: TransactionModalContextState['bottomSheetViewStyles']
  handleContentLayout: TransactionModalContextState['handleContentLayout']
}): JSX.Element {
  const state = useMemo<TransactionModalContextState>(
    (): TransactionModalContextState => ({
      bottomSheetViewStyles,
      handleContentLayout,
    }),
    [bottomSheetViewStyles, handleContentLayout]
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
