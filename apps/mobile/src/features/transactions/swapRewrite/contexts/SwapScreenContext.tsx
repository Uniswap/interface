import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react'

export enum SwapScreen {
  SwapForm,
  SwapReview,
}

type SwapScreenContextState = {
  screen: SwapScreen
  setScreen: Dispatch<SetStateAction<SwapScreen>>
}

export const SwapScreenContext = createContext<SwapScreenContextState | undefined>(undefined)

export function SwapScreenContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const [screen, setScreen] = useState<SwapScreen>(SwapScreen.SwapForm)

  const state = useMemo<SwapScreenContextState>(
    (): SwapScreenContextState => ({
      screen,
      setScreen,
    }),
    [screen]
  )

  return <SwapScreenContext.Provider value={state}>{children}</SwapScreenContext.Provider>
}

export const useSwapScreenContext = (): SwapScreenContextState => {
  const swapContext = useContext(SwapScreenContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapScreenContext` must be used inside of `SwapScreenContextProvider`')
  }

  return swapContext
}
