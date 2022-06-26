import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { Trans, t } from '@lingui/macro'
import QuestionHelper from 'components/QuestionHelper'
const ToggleButton = styled.span<{ size?: string; element?: HTMLSpanElement }>`
  position: absolute;
  transition: all 0.2s ease;
  background-color: ${({ theme }) => theme.primary};
  ${({ element }) => `transform: translateX(${element?.offsetLeft ?? 0}px); width: ${element?.offsetWidth || 0}px;`}
  border-radius: 20px;
  height: 100%;
  top: 0;
`

const ToggleElement = styled.span<{
  isActive?: boolean
}>`
  font-size: 14px;
  font-weight: 500;
  height: 32px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ isActive, theme }) => (isActive ? theme.textReverse : theme.text)};
  z-index: 1;
  transition: all 0.2s ease;
  flex: 1;
  cursor: pointer;
`

const ToggleWrapper = styled.button<{ background?: string }>`
  position: relative;
  border-radius: 20px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  width: fit-content;
  outline: none;
  padding: 0;
  border: none;
  width: 100%;
`

export interface FeeTypeSelectorProps {
  active?: string
  onChange: (type: string) => void
  bgColor?: 'background' | 'buttonBlack'
}

export default function FeeTypeSelector({ active = 'static', onChange, bgColor = 'background' }: FeeTypeSelectorProps) {
  const buttonsRef = useRef<any>({})
  const [activeElement, setActiveElement] = useState()

  useEffect(() => {
    setActiveElement(buttonsRef.current[active])
  }, [active])
  const buttons = [
    {
      name: 'static',
      content: (
        <>
          <Trans>Static Fees</Trans>{' '}
          <QuestionHelper
            text={t`You can select the appropriate fee tier for your pool. For each trade that uses this liquidity pool, liquidity providers will earn this trading fee.`}
            useCurrentColor
          />
        </>
      ),
    },
    {
      name: 'dynamic',
      content: (
        <>
          <Trans>Dynamic Fees</Trans>{' '}
          <QuestionHelper
            text={t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers.`}
            useCurrentColor
          />
        </>
      ),
    },
  ]
  return (
    <ToggleWrapper>
      {buttons.map(button => {
        return (
          <ToggleElement
            key={button.name}
            ref={el => {
              buttonsRef.current[button.name] = el
            }}
            isActive={active === button.name}
            onClick={() => onChange(button.name)}
          >
            {button.content}
          </ToggleElement>
        )
      })}
      <ToggleButton element={activeElement} />
    </ToggleWrapper>
  )
}
