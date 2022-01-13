import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

const ToggleButton = styled.span<{ isActive?: boolean; size?: string }>`
  position: absolute;
  transition: all 0.2s ease;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonGray)};
  ${({ isActive, size }) =>
    !isActive && (size === 'md' ? 'transform: translateX(48px);' : 'transform: translateX(32px);')}
  border-radius: ${({ size }) => (size === 'md' ? '16px' : '10px')};
  height: 100%;
  width: ${({ size }) => (size === 'md' ? '48px' : '32px')};
  top: 0;
`

const ToggleElement = styled.span<{ isActive?: boolean; size?: string; isOff?: boolean }>`
  font-size: ${({ size }) => (size === 'md' ? '16px' : '12px')};
  width: ${({ size }) => (size === 'md' ? '48px' : '32px')};
  height: ${({ size }) => (size === 'md' ? '32px' : '20px')};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.2s ease;
  color: ${({ theme, isActive, isOff }) => (isActive && !isOff ? theme.textReverse : theme.subText)};
  :hover {
    color: ${({ theme, isActive }) => (isActive ? theme.white : theme.text2)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean; size?: string }>`
  position: relative;
  border-radius: ${({ size }) => (size === 'md' ? '18px' : '12px')};
  border: none;
  border: 2px solid ${({ theme }) => theme.bg12};
  background: ${({ theme }) => theme.bg12};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
  size?: 'sm' | 'md'
}

export default function Toggle({ id, isActive, toggle, size = 'sm' }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle} size={size}>
      <ToggleElement isActive={isActive} size={size}>
        <Trans>On</Trans>
      </ToggleElement>
      <ToggleElement isActive={!isActive} size={size} isOff>
        <Trans>Off</Trans>
      </ToggleElement>
      <ToggleButton isActive={isActive} size={size} />
    </StyledToggle>
  )
}
