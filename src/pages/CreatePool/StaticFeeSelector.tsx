import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import styled from 'styled-components'
const ToggleButton = styled.span<{ size?: string; element?: HTMLSpanElement; firstRender?: boolean }>`
  position: absolute;
  transition: all ${({ firstRender }) => (firstRender ? '0s' : '0.2s')} ease;
  background-color: ${({ theme }) => theme.primary};
  ${({ element }) =>
    `transform: translateX(${element?.offsetLeft ? element?.offsetLeft - 4 : 0}px); width: ${element?.offsetWidth ||
      0}px;`}
  border-radius: 3px;
  height: 28px;
`

const ToggleElement = styled.span<{
  isActive?: boolean
}>`
  font-size: 14px;
  font-weight: 500;
  height: 28px;
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
  border-radius: 4px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  align-items: center;
  width: fit-content;
  outline: none;
  padding: 4px;

  border: none;
  width: 100%;
`

export interface FeeTypeSelectorProps {
  active?: string
  onChange: (name: string) => void
  options: { name: string; title: string }[]
}

export default function FeeTypeSelector({
  active = 'static',
  onChange,
  options = [{ name: '1', title: '0.01%' }],
}: FeeTypeSelectorProps) {
  const buttonsRef = useRef<any>({})
  const [activeElement, setActiveElement] = useState()
  const firstRender = useRef<boolean>(true)
  useEffect(() => {
    setTimeout(() => {
      firstRender.current = false
    }, 0)
  }, [])
  useEffect(() => {
    setActiveElement(buttonsRef.current[active])
  }, [active])

  return (
    <ToggleWrapper>
      {options.map(option => {
        return (
          <ToggleElement
            key={option.name}
            ref={el => {
              buttonsRef.current[option.name] = el
            }}
            isActive={active === option.name}
            onClick={() => onChange(option.name)}
          >
            {option.title}
          </ToggleElement>
        )
      })}
      <ToggleButton element={activeElement} firstRender={firstRender.current} />
    </ToggleWrapper>
  )
}
