import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'

export enum TransferScreen {
  TransferForm,
  TransferReview,
}

type TransferScreenContextState = {
  screen: TransferScreen
  screenRef: React.MutableRefObject<TransferScreen>
  setScreen: (screen: TransferScreen) => void
}

export const TransferScreenContext = createContext<TransferScreenContextState | undefined>(
  undefined
)

// TODO: re-use the same context built in extension, and move that to shared folder.
export function TransferScreenContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const screenRef = useRef<TransferScreen>(TransferScreen.TransferForm)
  const [screen, setScreen] = useState<TransferScreen>(TransferScreen.TransferForm)

  const wrappedSetScreen = useCallback((_screen: TransferScreen) => {
    screenRef.current = _screen
    setScreen(_screen)
  }, [])

  const state = useMemo<TransferScreenContextState>(
    (): TransferScreenContextState => ({
      screen,
      screenRef,
      setScreen: wrappedSetScreen,
    }),
    [screen, wrappedSetScreen]
  )

  return <TransferScreenContext.Provider value={state}>{children}</TransferScreenContext.Provider>
}

export const useTransferScreenContext = (): TransferScreenContextState => {
  const transferContext = useContext(TransferScreenContext)

  if (transferContext === undefined) {
    throw new Error(
      '`useTransferScreenContext ` must be used inside of `TransferScreenContextProvider`'
    )
  }

  return transferContext
}
