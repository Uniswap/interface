import { useModalLiquidityInitialState } from 'components/Liquidity/hooks'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { LiquidityModalInitialState } from 'state/application/reducer'

export enum DecreaseLiquidityStep {
  Input,
  Review,
}

type RemoveLiquidityModalState = {
  step: DecreaseLiquidityStep
  setStep: Dispatch<SetStateAction<DecreaseLiquidityStep>>
  percent: string
  setPercent: (percent: string) => void
  positionInfo?: LiquidityModalInitialState
  percentInvalid?: boolean
  unwrapNativeCurrency: boolean
  setUnwrapNativeCurrency: Dispatch<SetStateAction<boolean>>
}

const RemoveLiquidityModalContext = createContext<RemoveLiquidityModalState>({
  step: DecreaseLiquidityStep.Input,
  setStep: () => null,
  percent: '',
  setPercent: () => null,
  percentInvalid: true,
  unwrapNativeCurrency: true,
  setUnwrapNativeCurrency: () => null,
})

export function RemoveLiquidityModalContextProvider({ children }: PropsWithChildren): JSX.Element {
  const [step, setStep] = useState(DecreaseLiquidityStep.Input)
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)
  const [percent, setPercent] = useState<string>('')
  const positionInfo = useModalLiquidityInitialState()
  const percentInvalid = percent === '0' || percent === '' || !percent

  const ctx = useMemo(
    () => ({
      percent,
      setPercent,
      step,
      setStep,
      positionInfo,
      percentInvalid,
      unwrapNativeCurrency,
      setUnwrapNativeCurrency,
    }),
    [percent, step, positionInfo, percentInvalid, unwrapNativeCurrency, setUnwrapNativeCurrency],
  )

  return <RemoveLiquidityModalContext.Provider value={ctx}>{children}</RemoveLiquidityModalContext.Provider>
}

export function useRemoveLiquidityModalContext() {
  const removeModalContext = useContext(RemoveLiquidityModalContext)

  if (removeModalContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeModalContext
}
