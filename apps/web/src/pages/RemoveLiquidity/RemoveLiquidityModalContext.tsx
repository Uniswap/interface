import { PositionInfo } from 'components/Liquidity/types'
import { useModalLiquidityPositionInfo } from 'components/Liquidity/utils'
import { PropsWithChildren, createContext, useContext, useState } from 'react'

type RemoveLiquidityModalState = {
  percent: string
  setPercent: (percent: string) => void
  positionInfo?: PositionInfo
  percentInvalid?: boolean
}

const RemoveLiquidityModalContext = createContext<RemoveLiquidityModalState>({
  percent: '',
  setPercent: () => null,
  percentInvalid: true,
})

export function RemoveLiquidityModalContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [percent, setPercent] = useState<string>('')
  const positionInfo = useModalLiquidityPositionInfo()
  const percentInvalid = percent === '0' || percent === '' || !percent
  return (
    <RemoveLiquidityModalContext.Provider value={{ percent, setPercent, positionInfo, percentInvalid }}>
      {children}
    </RemoveLiquidityModalContext.Provider>
  )
}

export function useLiquidityModalContext() {
  const removeModalContext = useContext(RemoveLiquidityModalContext)

  if (removeModalContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeModalContext
}
