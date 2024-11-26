import { useDerivedIncreaseLiquidityInfo } from 'components/IncreaseLiquidity/hooks'
import { useModalLiquidityPositionInfo } from 'components/Liquidity/hooks'
import { DepositInfo, PositionInfo } from 'components/Liquidity/types'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { PositionField } from 'types/position'

export enum IncreaseLiquidityStep {
  Input,
  Review,
}

export interface IncreaseLiquidityState {
  position?: PositionInfo
  exactField: PositionField
  exactAmount?: string
}
const DEFAULT_INCREASE_LIQUIDITY_STATE = {
  step: IncreaseLiquidityStep.Input,
  exactField: PositionField.TOKEN0,
}

// This increase-specific context needs to recalculate deposit0Disabled and deposit1Disabled,
// which are derived from price range inputs in the regular create flow.
export type IncreaseLiquidityDerivedInfo = DepositInfo & {
  deposit0Disabled?: boolean
  deposit1Disabled?: boolean
}

interface IncreaseLiquidityContextType {
  step: IncreaseLiquidityStep
  setStep: Dispatch<SetStateAction<IncreaseLiquidityStep>>
  increaseLiquidityState: IncreaseLiquidityState
  derivedIncreaseLiquidityInfo: IncreaseLiquidityDerivedInfo
  setIncreaseLiquidityState: Dispatch<SetStateAction<IncreaseLiquidityState>>
}

const IncreaseLiquidityContext = createContext<IncreaseLiquidityContextType>({
  step: IncreaseLiquidityStep.Input,
  setStep: () => undefined,
  increaseLiquidityState: DEFAULT_INCREASE_LIQUIDITY_STATE,
  derivedIncreaseLiquidityInfo: {},
  setIncreaseLiquidityState: () => undefined,
})

export function useIncreaseLiquidityContext() {
  return useContext(IncreaseLiquidityContext)
}

export function IncreaseLiquidityContextProvider({ children }: PropsWithChildren) {
  const positionInfo = useModalLiquidityPositionInfo()

  const [step, setStep] = useState(IncreaseLiquidityStep.Input)

  const [increaseLiquidityState, setIncreaseLiquidityState] = useState<IncreaseLiquidityState>({
    ...DEFAULT_INCREASE_LIQUIDITY_STATE,
    position: positionInfo,
  })

  const derivedIncreaseLiquidityInfo = useDerivedIncreaseLiquidityInfo(increaseLiquidityState)

  const value = useMemo(
    () => ({
      step,
      setStep,
      increaseLiquidityState,
      setIncreaseLiquidityState,
      derivedIncreaseLiquidityInfo,
    }),
    [increaseLiquidityState, derivedIncreaseLiquidityInfo, step],
  )

  return <IncreaseLiquidityContext.Provider value={value}>{children}</IncreaseLiquidityContext.Provider>
}
