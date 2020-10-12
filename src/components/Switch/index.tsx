import React from 'react'
import styled from 'styled-components'

const ToggleWrap = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
`

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  border-radius: 14px;
  background: #ffffff;
  color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3)};
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 400;
  position: absolute;
  padding: 0.7rem 0.7rem;
  /* color: ${({ theme, isActive, isOnSwitch }) =>
    isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text2}; */
  font-size: 1rem;
  font-weight: ${({ isOnSwitch }) => (isOnSwitch ? '500' : '400')};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    /* border: 3px solid rgba(0, 0, 0, 0.04); */
    /* background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? theme.primary1 : theme.text3) : 'none'}; */
    /* color: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3}; */
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 12px;
  border: none;
  /* border: 1px solid ${({ theme, isActive }) => (isActive ? theme.primary5 : theme.text4)}; */
  background: #000000;
  display: flex;
  position: relative;
  align-items: center;
  cursor: pointer;
  outline: none;
  padding: 0;
  width: 38px;
  height: 14px;
  border-radius: 14px;
  opacity: .38;
  transition: opacity 90ms cubic-bezier(0.4, 0, 0.2, 1), background-color 90ms cubic-bezier(0.4, 0, 0.2, 1), border-color 90ms cubic-bezier(0.4, 0, 0.2, 1);
`

export interface ToggleProps {
  id?: string
  isActive?: boolean
  toggle?: () => void
}

export default function Switch({ id, isActive = false, toggle }: ToggleProps) {
  return (
    <ToggleWrap>
      <StyledToggle id={id} isActive={isActive} onClick={toggle}>
        <ToggleElement isActive={isActive} isOnSwitch={true}></ToggleElement>
        <ToggleElement isActive={!isActive} isOnSwitch={false}></ToggleElement>
      </StyledToggle>
    </ToggleWrap>
  )
}
