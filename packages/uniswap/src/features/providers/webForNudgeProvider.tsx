import { isWebApp } from '@universe/environment'
import React from 'react'
import type { AddFundsPressParams } from 'uniswap/src/features/providers/webForNudgeTypes'
import { useIsPortfolioZero } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsPortfolioZero'

type StateContext = boolean
type SetContext = (v: boolean) => void

const WebFORNudgeStateContext = React.createContext<StateContext>(false)
WebFORNudgeStateContext.displayName = 'WebFORNudgeStateContext'

const WebFORNudgeSetContext = React.createContext<SetContext>((_: boolean) => {})
WebFORNudgeSetContext.displayName = 'WebFORNudgeSetContext'

const WebFORNudgeEnabledContext = React.createContext<boolean>(false)
WebFORNudgeEnabledContext.displayName = 'WebFORNudgeEnabledContext'

type AddFundsPress = (params: AddFundsPressParams) => void

const WebFORNudgeAddFundsPressContext = React.createContext<AddFundsPress | undefined>(undefined)
WebFORNudgeAddFundsPressContext.displayName = 'WebFORNudgeAddFundsPressContext'

// This is a provider to wrap the swap component to maintain the state across different swap tabs
export function WebFORNudgeProvider({
  children,
  onAddFundsPress,
}: {
  children: React.ReactNode
  /** When set, the swap button's Add funds action calls this instead of expanding the inline nudge cards. */
  onAddFundsPress?: AddFundsPress
}): JSX.Element {
  const [state, setState] = React.useState(false)
  const isWebFORNudgeEnabled = useWebFORNudgeGateEnabled()

  if (state && !isWebFORNudgeEnabled) {
    setState(false)
  }

  return (
    <WebFORNudgeEnabledContext.Provider value={isWebFORNudgeEnabled}>
      <WebFORNudgeStateContext.Provider value={state}>
        <WebFORNudgeSetContext.Provider value={setState}>
          <WebFORNudgeAddFundsPressContext.Provider value={onAddFundsPress}>
            {children}
          </WebFORNudgeAddFundsPressContext.Provider>
        </WebFORNudgeSetContext.Provider>
      </WebFORNudgeStateContext.Provider>
    </WebFORNudgeEnabledContext.Provider>
  )
}

export function useWebFORNudgeAddFundsPress(): AddFundsPress | undefined {
  return React.useContext(WebFORNudgeAddFundsPressContext)
}

export function useIsShowingWebFORNudge(): boolean {
  return React.useContext(WebFORNudgeStateContext)
}

export function useSetIsShowingWebFORNudge(): (v: boolean) => void {
  return React.useContext(WebFORNudgeSetContext)
}

export function useWebFORNudgeGateEnabled(): boolean {
  const isPortfolioZero = useIsPortfolioZero()

  return isWebApp && isPortfolioZero
}

export function useIsWebFORNudgeEnabled(): boolean {
  return React.useContext(WebFORNudgeEnabledContext)
}
