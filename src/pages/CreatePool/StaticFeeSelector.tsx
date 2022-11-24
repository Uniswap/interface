import { useEffect, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import styled from 'styled-components'

const ToggleButton = styled.span<{ size?: string; element?: HTMLSpanElement; firstRender?: boolean }>`
  position: absolute;
  transition: all ${({ firstRender }) => (firstRender ? '0s' : '0.2s')} ease;
  background-color: ${({ theme }) => theme.primary};
  ${({ element }) =>
    `transform: translateX(${element?.offsetLeft ? element?.offsetLeft - 4 : 0}px); width: ${
      element?.offsetWidth || 0
    }px;`}
  border-radius: 999px;
  height: 28px;
`

const ToggleElement = styled.span<{
  isActive?: boolean
}>`
  font-size: 12px;
  font-weight: 500;
  height: 28px;
  padding: 3px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ isActive, theme }) => (isActive ? theme.textReverse : theme.text)};
  z-index: 1;
  transition: all 0.2s ease;
  flex: 1;
  cursor: pointer;

  @media screen and (min-width: 450px) {
    font-size: 14px;
    padding: 6px 12px;
  }
`

const ToggleWrapper = styled.button<{ background?: string }>`
  position: relative;
  border-radius: 999px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  align-items: center;
  max-width: 100%;
  outline: none;
  padding: 4px;
  border: none;
`

const SelectWrapper = styled.select`
  padding: 10px 5px;
  background: ${({ theme }) => theme.buttonGray};
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  border: none;
`
interface StaticFeeSelectorProps {
  active?: number
  onChange: (name: number) => void
  options: { name: number; title: string }[]
}

export default function StaticFeeSelector({
  active = 1,
  onChange,
  options = [{ name: 1, title: '0.01%' }],
}: StaticFeeSelectorProps) {
  const buttonsRef = useRef<any>({})
  const [activeElement, setActiveElement] = useState()
  const firstRender = useRef<boolean>(true)
  const above400 = useMedia('(min-width:400px)')
  useEffect(() => {
    setTimeout(() => {
      firstRender.current = false
    }, 0)
  }, [])
  useEffect(() => {
    setActiveElement(buttonsRef.current[active])
  }, [active])

  return above400 ? (
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
  ) : (
    <SelectWrapper
      onChange={e => {
        onChange(parseFloat(e.target.value))
      }}
      style={{ background: 'black', color: 'white' }}
    >
      {options.map(option => {
        return (
          <option key={option.name} value={option.name}>
            {option.title}
          </option>
        )
      })}
    </SelectWrapper>
  )
}
