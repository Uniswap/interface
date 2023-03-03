import { createContext, useContext } from 'react'

import { DetailedRouteSummary, FeeConfig } from 'types/route'

type SwapFormContextProps = {
  feeConfig: FeeConfig | undefined
  slippage: number
  routeSummary: DetailedRouteSummary | undefined
  typedValue: string
  isSaveGas: boolean
  recipient: string | null
}

const SwapFormContext = createContext<SwapFormContextProps>({
  feeConfig: undefined,
  slippage: 0,
  routeSummary: undefined,
  typedValue: '',
  isSaveGas: false,
  recipient: null,
})

const SwapFormContextProvider: React.FC<
  SwapFormContextProps & {
    children: React.ReactNode
  }
> = ({ children, ...props }) => {
  const contextValue: SwapFormContextProps = props
  return <SwapFormContext.Provider value={contextValue}>{children}</SwapFormContext.Provider>
}

const useSwapFormContext = () => {
  const context = useContext(SwapFormContext)
  if (!context) {
    throw new Error('hook is used outside of SwapFormContext')
  }

  return context
}

export { SwapFormContextProvider, useSwapFormContext }
