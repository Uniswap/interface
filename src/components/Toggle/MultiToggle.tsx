import React from 'react'
import styled from 'styled-components'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  width: 100%;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background: ${({ theme, isActive }) => (isActive ? theme.bg2 : 'none')};
  color: ${({ theme, isActive }) => (isActive ? theme.text1 : theme.text3)};
  font-size: 1rem;
  font-weight: 400;
  padding: 0.35rem 0.6rem;
  :hover {
    user-select: initial;
    color: ${({ theme, isActive }) => (isActive ? theme.text2 : theme.text3)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean; width?: string }>`
  display: flex;
  width: ${({ width }) => width ?? '100%'}
  padding: 2px;
  background: ${({ theme }) => theme.bg0};
  border-radius: 8px;
  border: ${({ theme }) => '2px solid ' + theme.bg2};
  cursor: pointer;
  outline: none;
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
    <StyledToggle id={id} isActive={activeIndex === 0} width={width}>
      {options.map((option, index) => (
        <ToggleElement
          key={id + '-' + index}
          isActive={index === activeIndex}
          isOnSwitch={true}
          onClick={() => toggle(index)}
        >
          {option}
        </ToggleElement>
      ))}
    </StyledToggle>
  )
}
