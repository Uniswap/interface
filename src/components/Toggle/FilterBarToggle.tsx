import React, { CSSProperties } from 'react'
import styled from 'styled-components'

const StyledToggle = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 40px;
  height: 20px;
  background: ${({ theme, isActive }) => (isActive ? theme.primary : theme.bg3)};
  border-radius: 16px;
  cursor: pointer;
`

const ActiveDot = styled.div<{ isActive: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme, isActive }) => (isActive ? theme.bg20 : theme.buttonBlack)};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease-in-out;

  ${({ isActive }) => (isActive ? `left: 21px;` : `left: 3px;`)}
`

export interface ToggleProps {
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
}

export default function FilterBarToggle({ isActive, toggle, style }: ToggleProps) {
  return (
    <StyledToggle isActive={isActive} onClick={toggle} style={style}>
      <ActiveDot isActive={isActive} />
    </StyledToggle>
  )
}
