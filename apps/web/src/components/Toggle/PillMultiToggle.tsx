import { Trans } from '@lingui/macro'
import { createRef, useLayoutEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

const togglePadding = 4

const OptionsSelector = styled.div`
  display: flex;
  position: relative;
  justify-content: flex-end;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  height: 40px;
  padding: ${togglePadding}px;
  width: fit-content;
`

interface ActivePillStyle {
  left?: string
  width?: string
  transition?: string
}

const ActivePill = styled.div`
  position: absolute;
  height: 30px;
  background-color: ${({ theme }) => theme.surface3};
  border-radius: 15px;
  transition: left 0.3s ease, width 0.3s ease;
`
const OptionButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  font-weight: 535;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 15px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`

interface PillMultiToggleOption {
  value: string // Value to be selected/stored, used as default display value
  display?: JSX.Element // Optional custom display element
}

function getPillMultiToggleOption(option: PillMultiToggleOption | string): PillMultiToggleOption {
  if (typeof option === 'string') {
    return { value: option }
  }
  return option
}

export default function PillMultiToggle({
  options,
  currentSelected,
  onSelectOption,
}: {
  options: readonly (PillMultiToggleOption | string)[]
  currentSelected: string
  onSelectOption: (option: string) => void
}) {
  const buttonRefs = useMemo(() => options.map(() => createRef<HTMLButtonElement>()), [options])
  const [buttonSizing, setButtonSizing] = useState<{ [option: string]: ActivePillStyle }>({})

  // Do active pill width/left calculations
  useLayoutEffect(() => {
    const sizeMap = buttonRefs.reduce((acc, ref, index) => {
      const current = ref.current
      const { value } = getPillMultiToggleOption(options[index])

      acc[value] = { width: (current?.offsetWidth ?? 0) + 'px', left: (current?.offsetLeft ?? 0) + 'px' }
      return acc
    }, {} as { [option: string]: ActivePillStyle })
    setButtonSizing(sizeMap)
  }, [options, buttonRefs])

  return (
    <OptionsSelector>
      <ActivePill style={buttonSizing[currentSelected]} />
      {options.map((option, i) => {
        const { value, display } = getPillMultiToggleOption(option)
        const ref = buttonRefs[i]
        return (
          <OptionButton ref={ref} key={value} active={currentSelected === value} onClick={() => onSelectOption(value)}>
            {display ?? <Trans>{value}</Trans>}
          </OptionButton>
        )
      })}
    </OptionsSelector>
  )
}
