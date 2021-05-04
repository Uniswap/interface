import React from 'react'
import styled from 'styled-components'

export const ToggleWrapper = styled.button<{ width?: string }>`
  display: flex;
  align-items: center;
  width: ${({ width }) => width ?? '100%'};
  padding: 1px;
  background: ${({ theme }) => theme.bg1};
  border-radius: 8px;
  border: ${({ theme }) => '1px solid ' + theme.bg2};
  cursor: pointer;
  outline: none;
`

export const ToggleElement = styled.span<{ isActive?: boolean; fontSize?: string }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0.5rem;
  border-radius: 6px;
  justify-content: center;
  height: 100%;
  background: ${({ theme, isActive }) => (isActive ? theme.bg0 : 'none')};
  color: ${({ theme, isActive }) => (isActive ? theme.text1 : theme.text3)};
  font-size: ${({ fontSize }) => fontSize ?? '1rem'};
  font-weight: 500;
  white-space: nowrap;
  :hover {
    user-select: initial;
    color: ${({ theme, isActive }) => (isActive ? theme.text2 : theme.text3)};
  }
`

export const ToggleText = styled.div`
  color: ${({ theme }) => theme.text3};
  font-size: 12px;
  margin-right: 0.5rem;
  width: 100%;
  white-space: nowrap;
  padding: 0 0 0 4px;
`

export interface ToggleProps {
  options: string[]
  activeIndex: number
  toggle: (index: number) => void
  id?: string
  width?: string
}

export default function MultiToggle({ id, options, activeIndex, toggle, width }: ToggleProps) {
  return (
    <ToggleWrapper id={id} width={width}>
      {options.map((option, index) => (
        <ToggleElement key={id + '-' + index} isActive={index === activeIndex} onClick={() => toggle(index)}>
          {option}
        </ToggleElement>
      ))}
    </ToggleWrapper>
  )
}
