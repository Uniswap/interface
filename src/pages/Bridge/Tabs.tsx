import React from 'react'
import styled from 'styled-components'

import Row from '../../components/Row'
import { BridgeStep } from './utils'

interface TabsProps {
  step: BridgeStep
  setStep: (step: BridgeStep) => void
  handleResetBridge: () => void
}

export const Tabs = ({ step, setStep, handleResetBridge }: TabsProps) => {
  const isCollecting = step === BridgeStep.Collect

  return (
    <TabsRow>
      <Button
        onClick={() => {
          if (step !== BridgeStep.Initial) handleResetBridge()
          setStep(BridgeStep.Initial)
        }}
        className={!isCollecting ? 'active' : ''}
      >
        Bridge
      </Button>
      <Button className={isCollecting ? 'active' : ''} disabled={!isCollecting}>
        Collect
      </Button>
    </TabsRow>
  )
}

const TabsRow = styled(Row)`
  display: inline-flex;
  width: auto;
  margin: 0 0 10px;
  padding: 2px;
  background: #191a24;
  border-radius: 12px;
`

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 8.5px 10px;
  font-weight: 600;
  font-size: 11px;
  line-height: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8780bf;
  border-radius: 10px;
  border: none;
  background: none;
  cursor: pointer;

  &.active {
    color: #ffffff;
    background: #2a2f42;
  }

  &:disabled {
    color: #504d72;
    cursor: not-allowed;
  }
`
