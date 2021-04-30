import React from 'react'
import styled, { css } from 'styled-components'
import border8pxRadius from '../../assets/images/border-8px-radius.png'
import { Colors } from '../../theme/styled'

const ToggleElement = styled.span<{
  isActive?: boolean
  isOnSwitch?: boolean
  disabled?: boolean
  highlightColor: keyof Colors
}>`
  border-radius: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  ${({ isActive }) =>
    isActive
      ? css`
          padding: 0px 2px;
          border: 8px solid;
          border-image: url(${border8pxRadius}) 8;
        `
      : css`
          padding: 8px 10px;
        `}
  background: ${({ theme, disabled, isActive, highlightColor }) => {
    if (isActive) {
      return disabled ? theme.bg4 : theme[highlightColor]
    }
    return theme.bg3
  }};
  color: ${({ theme, disabled, isActive }) => (!disabled && isActive ? theme.white : theme.text3)};
  font-size: 13px;
  line-height: 15.85px;
  font-weight: 500;
  text-transform: uppercase;
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean; disabled?: boolean }>`
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.bg3};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  disabled?: boolean
  toggle: () => void
}

export default function Toggle({ id, isActive, disabled, toggle }: ToggleProps) {
  return (
    <StyledToggle disabled={disabled} id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement disabled={disabled} isActive={isActive} isOnSwitch={true} highlightColor="green2">
        On
      </ToggleElement>
      <ToggleElement disabled={disabled} isActive={!isActive} isOnSwitch={false} highlightColor="red1">
        Off
      </ToggleElement>
    </StyledToggle>
  )
}
