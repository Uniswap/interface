import { useModalLiquidityPositionInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useState } from 'react'

export enum DecreaseLiquidityStep {
  Input,
  Review,
}

type RemoveLiquidityModalState = {
  step: DecreaseLiquidityStep
  setStep: Dispatch<SetStateAction<DecreaseLiquidityStep>>
  percent: string
  setPercent: (percent: string) => void
  positionInfo?: PositionInfo
  percentInvalid?: boolean
}

const RemoveLiquidityModalContext = createContext<RemoveLiquidityModalState>({
  step: DecreaseLiquidityStep.Input,
  setStep: () => null,
  percent: '',
  setPercent: () => null,
  percentInvalid: true,
})

export function RemoveLiquidityModalContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [step, setStep] = useState(DecreaseLiquidityStep.Input)
  const [percent, setPercent] = useState<string>('')
  const positionInfo = useModalLiquidityPositionInfo()
  const percentInvalid = percent === '0' || percent === '' || !percent

  return (
    <RemoveLiquidityModalContext.Provider value={{ percent, setPercent, step, setStep, positionInfo, percentInvalid }}>
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
