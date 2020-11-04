import React from 'react'
import styled, { css } from 'styled-components'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  border-radius: 8px;
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
  background: ${({ theme, isActive }) => (isActive ? theme.primary1 : 'none')};
  color: ${({ theme, isActive }) => (isActive ? theme.white : theme.text3)};
  font-size: 16px;
  line-height: 19px;
  font-weight: 500;
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
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
  toggle: () => void
}

export default function Toggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} isOnSwitch={true}>
        On
      </ToggleElement>
      <ToggleElement isActive={!isActive} isOnSwitch={false}>
        Off
      </ToggleElement>
    </StyledToggle>
  )
}
