import React from 'react'
import styled from 'styled-components'

const ToggleWrap = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
`

const StyledToggle = styled.button<{ isActive: boolean }>`
  border-radius: 12px;
  border: none;
  background-color: ${({ isActive }) => (isActive ? '#98e8c6' : '#bfc8cd')};
  display: flex;
  position: relative;
  align-items: center;
  cursor: pointer;
  outline: none;
  padding: 0;
  width: 38px;
  height: 12px;
  border-radius: 12px;
  transition: opacity 90ms cubic-bezier(0.4, 0, 0.2, 1), background-color 90ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 90ms cubic-bezier(0.4, 0, 0.2, 1);
`

const ToggleElement = styled.div<{ isActive: boolean }>`
  border-radius: 14px;
  background: ${({ isActive }) => (isActive ? '#05d394' : '#ffffff')};
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14),
    0px 1px 3px 0px rgba(0, 0, 0, 0.12);
  border-radius: 50%;
  left: ${({ isActive }) => (isActive ? 'auto' : '-2px')};
  right: ${({ isActive }) => (isActive ? '-2px' : 'auto')};
  position: absolute;
  padding: 0.64rem 0.64rem;
  ${ToggleWrap}:hover & {
    box-shadow: ${({ isActive }) =>
      isActive
        ? '0px 0px 0px 8px rgba(5, 211, 148, 0.16), 0px 2px 1px -1px rgba(0, 0, 0, 0.2),0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)'
        : '0px 0px 0px 8px rgba(0, 0, 0, 0.08), 0px 2px 1px -1px rgba(0, 0, 0, 0.2),0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)'};
  }
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle?: () => void
}

export default function Switch({ id, isActive = false, toggle }: ToggleProps) {
  return (
    <ToggleWrap
      onClick={event => {
        event.stopPropagation()
        toggle?.()
      }}
    >
      <StyledToggle id={id} isActive={isActive}>
        <ToggleElement isActive={isActive}></ToggleElement>
      </StyledToggle>
    </ToggleWrap>
  )
}
