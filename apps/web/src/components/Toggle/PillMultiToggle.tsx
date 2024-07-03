import { t } from 'i18n'
import { createRef, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

const togglePadding = 4

const OptionsSelector = styled.div`
  display: flex;
  position: relative;
  justify-content: flex-end;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  padding: ${togglePadding}px;
  width: 100%;
`

const ActivePill = styled.div<{ activePillColor?: string }>`
  position: absolute;
  height: calc(100% - ${togglePadding * 2}px);
  top: ${togglePadding}px;
  background-color: ${({ theme, activePillColor }) => activePillColor || theme.neutral3};
  border-radius: 16px;
  transition: left 0.3s ease, width 0.3s ease;
`
const OptionButton = styled.button<{ active: boolean; activeTextColor?: string }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  font-weight: 535;
  font-size: 16px;
  border-radius: 15px;
  line-height: 20px;
  border: none;
  cursor: pointer;
  outline: none;
  color: ${({ theme, active, activeTextColor }) => (active ? activeTextColor || theme.neutral1 : theme.neutral2)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  z-index: ${Z_INDEX.active};
  transition: all 0.2s;
  :hover {
    ${({ active, theme }) =>
      !active &&
      `
    opacity: ${theme.opacity.hover};
    background: ${theme.surface3};
    `}
  }
`

function getPillMultiToggleOption(option: PillMultiToggleOption | string): PillMultiToggleOption {
  if (typeof option === 'string') {
    return { value: option }
  }
  return option
}

export interface PillMultiToggleOption {
  value: string | number // Value to be selected/stored, used as default display value
  display?: JSX.Element // Optional custom display element
}

interface PillMultiToggleProps {
  options: readonly (PillMultiToggleOption | string)[]
  currentSelected: string | number
  onSelectOption: (option: string | number) => void
  activePillColor?: string
  activeTextColor?: string
}

export default function PillMultiToggle({
  options,
  currentSelected,
  onSelectOption,
  activePillColor,
  activeTextColor,
}: PillMultiToggleProps) {
  const buttonRefs = useMemo(() => options.map(() => createRef<HTMLButtonElement>()), [options])
  const [style, setStyle] = useState({})
  const [activeIndex, setActiveIndex] = useState(
    options.map((o) => getPillMultiToggleOption(o).value).indexOf(currentSelected)
  )

  useEffect(() => {
    const current = buttonRefs[activeIndex].current
    setStyle({
      left: current?.offsetLeft,
      width: current?.offsetWidth,
    })
  }, [buttonRefs, activeIndex])

  return (
    <OptionsSelector>
      <ActivePill style={{ ...style }} activePillColor={activePillColor} />
      {options.map((option, i) => {
        const { value, display } = getPillMultiToggleOption(option)
        const ref = buttonRefs[i]

        return (
          <OptionButton
            ref={ref}
            key={value}
            active={currentSelected === value}
            activeTextColor={activeTextColor}
            onClick={() => {
              setActiveIndex(i)
              onSelectOption(value)
            }}
          >
            {display ?? <>{t(`{{value}}`, { value })}</>}
          </OptionButton>
        )
      })}
    </OptionsSelector>
  )
}
