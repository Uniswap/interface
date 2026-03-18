import { createContext, ReactNode, useContext, useMemo } from 'react'
import { isWebPlatform } from 'utilities/src/platform'

type BottomSheetContextState = {
  // `isSheetReady` is `true` as soon as the sheet has just begun animating from the bottom.
  // When rendering a sheet with too much content, it would take too long for the sheet to begin animating, so we use this flag to delay rendering of some of the content inside the sheet.
  // See any fullscreen modal in this repo for an example on how to use this (Swap, Explore, Send, Buy, etc).
  // https://linear.app/uniswap/issue/MOB-1399/fix-lag-when-opening-bottom-sheets
  isSheetReady: boolean
}

const BottomSheetContext = createContext<BottomSheetContextState | undefined>(undefined)

export function BottomSheetContextProvider({
  children,
  isSheetReady,
}: {
  children: ReactNode
  isSheetReady: boolean
}): JSX.Element {
  const state = useMemo<BottomSheetContextState>(
    (): BottomSheetContextState => ({
      isSheetReady,
    }),
    [isSheetReady],
  )

  return <BottomSheetContext.Provider value={state}>{children}</BottomSheetContext.Provider>
}

export const useBottomSheetContext = ({
  forceSafeReturn,
  // Use forceSafeReturn to conditionally use context with feature flags
}: {
  forceSafeReturn?: boolean
} = {}): BottomSheetContextState => {
  const bottomSheetContext = useContext(BottomSheetContext)

  if (isWebPlatform) {
    return { isSheetReady: true }
  }

  if (bottomSheetContext === undefined) {
    if (forceSafeReturn) {
      return { isSheetReady: true }
    }

    throw new Error('`useBottomSheetContext` must be used inside of `BottomSheetContextProvider`')
  }

  return bottomSheetContext
}
