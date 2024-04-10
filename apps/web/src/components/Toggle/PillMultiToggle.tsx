import { t } from '@lingui/macro'
import { createRef, useMemo, useState } from 'react'
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
  height: 36px;
  padding: ${togglePadding}px;
  width: 100%;
`

const ActivePill = styled.div`
  position: absolute;
  height: 28px;
  top: 3px;
  background-color: ${({ theme }) => theme.surface3};
  border-radius: 16px;
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
  z-index: ${Z_INDEX.active};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`

export interface PillMultiToggleOption {
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

  const [activeIndex, setActiveIndex] = useState(
    options.map((o) => getPillMultiToggleOption(o).value).indexOf(currentSelected)
  )

  return (
    <OptionsSelector>
      <ActivePill
        style={{
          width: buttonRefs[activeIndex].current?.offsetWidth,
          left: buttonRefs[activeIndex].current?.offsetLeft,
        }}
      />
      {options.map((option, i) => {
        const { value, display } = getPillMultiToggleOption(option)
        const ref = buttonRefs[i]

        return (
          <OptionButton
            ref={ref}
            key={value}
            active={currentSelected === value}
            onClick={() => {
              setActiveIndex(i)
              onSelectOption(value)
            }}
          >
            {display ?? <>{t`${value}`}</>}
          </OptionButton>
        )
      })}
    </OptionsSelector>
  )
}
