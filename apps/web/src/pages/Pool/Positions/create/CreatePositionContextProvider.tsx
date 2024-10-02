import { FeeTierSearchModal } from 'components/Liquidity/FeeTierSearchModal'
import { CreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useDerivedPositionInfo } from 'pages/Pool/Positions/create/hooks'
import { DEFAULT_POSITION_STATE, PositionFlowStep, PositionState } from 'pages/Pool/Positions/create/types'
import { useState } from 'react'

export function CreatePositionContextProvider({
  children,
  initialState = {},
}: {
  children: React.ReactNode
  initialState?: Partial<PositionState>
}) {
  const [positionState, setPositionState] = useState<PositionState>({ ...DEFAULT_POSITION_STATE, ...initialState })
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  const derivedPositionInfo = useDerivedPositionInfo(positionState)
  const [feeTierSearchModalOpen, setFeeTierSearchModalOpen] = useState(false)

  return (
    <CreatePositionContext.Provider
      value={{
        step,
        setStep,
        positionState,
        setPositionState,
        derivedPositionInfo,
        feeTierSearchModalOpen,
        setFeeTierSearchModalOpen,
      }}
    >
      {children}
      <FeeTierSearchModal />
    </CreatePositionContext.Provider>
  )
}
