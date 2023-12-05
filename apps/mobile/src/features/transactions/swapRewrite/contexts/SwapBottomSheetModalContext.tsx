import { createContext, ReactNode, useContext, useMemo } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'

type SwapBottomSheetModalContextState = {
  bottomSheetViewStyles: StyleProp<ViewStyle>
  handleContentLayout: (event: LayoutChangeEvent) => void
}

export const SwapBottomSheetModalContext = createContext<
  SwapBottomSheetModalContextState | undefined
>(undefined)

export function SwapBottomSheetModalContextProvider({
  children,
  bottomSheetViewStyles,
  handleContentLayout,
}: {
  children: ReactNode
  bottomSheetViewStyles: SwapBottomSheetModalContextState['bottomSheetViewStyles']
  handleContentLayout: SwapBottomSheetModalContextState['handleContentLayout']
}): JSX.Element {
  const state = useMemo<SwapBottomSheetModalContextState>(
    (): SwapBottomSheetModalContextState => ({
      bottomSheetViewStyles,
      handleContentLayout,
    }),
    [bottomSheetViewStyles, handleContentLayout]
  )

  return (
    <SwapBottomSheetModalContext.Provider value={state}>
      {children}
    </SwapBottomSheetModalContext.Provider>
  )
}

export const useSwapBottomSheetModalContext = (): SwapBottomSheetModalContextState => {
  const context = useContext(SwapBottomSheetModalContext)

  if (context === undefined) {
    throw new Error(
      '`useSwapBottomSheetModalContext` must be used inside of `SwapBottomSheetModalContextProvider`'
    )
  }

  return context
}
