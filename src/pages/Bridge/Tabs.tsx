import React, { useCallback } from 'react'
import styled from 'styled-components'

import Row from '../../components/Row'
import { useBridgeTxsFilter } from '../../state/bridge/hooks'
import { BridgeTxsFilter } from '../../state/bridge/reducer'
import { BridgeStep } from './utils'

interface TabsProps {
  step: BridgeStep
  setStep: (step: BridgeStep) => void
  handleResetBridge: () => void
  handleCollectTab: () => void
}

export const Tabs = ({ step, setStep, handleResetBridge, handleCollectTab }: TabsProps) => {
  const isCollecting = step === BridgeStep.Collect
  const [txsFilter, setTxsFilter] = useBridgeTxsFilter()

  const toggleFilter = useCallback(() => {
    if (txsFilter !== BridgeTxsFilter.COLLECTABLE) setTxsFilter(BridgeTxsFilter.COLLECTABLE)
    else setTxsFilter(BridgeTxsFilter.RECENT)
  }, [setTxsFilter, txsFilter])

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
      <Button
        onClick={() => {
          handleCollectTab()
          toggleFilter()
        }}
        className={isCollecting ? 'active' : ''}
        // disabled={!isCollecting}
      >
        Collect
      </Button>
    </TabsRow>
  )
}

const TabsRow = styled(Row)`
  position: absolute;
  top: -10px;
  left: 0;
  width: auto;
  transform: translateY(-100%);
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
