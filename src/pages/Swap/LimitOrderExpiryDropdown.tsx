import { useState } from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

export enum LimitOrderExpiry {
  Never = 'Never',
  OneHour = '1 hour',
  OneDay = '24 hours',
  OneWeek = '1 week',
}

const EXPIRY_OPTIONS = [
  LimitOrderExpiry.OneHour,
  LimitOrderExpiry.OneDay,
  LimitOrderExpiry.OneWeek,
  LimitOrderExpiry.Never,
]

export function LimitOrderExpiryDropdown({
  selected,
  onSelect,
}: {
  selected: LimitOrderExpiry
  onSelect: (newExpiry: LimitOrderExpiry) => void
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  const onSelectOption = (option: LimitOrderExpiry) => {
    onSelect(option)
    setShowDropdown(false)
  }

  return (
    <ExpirySection>
      <Selector tabIndex={showDropdown ? -1 : undefined} show={!showDropdown} onClick={() => setShowDropdown(true)}>
        <ThemedText.SubHeaderSmall>Expiry</ThemedText.SubHeaderSmall>
        <SelectedOption>
          <ThemedText.BodyPrimary>{selected}</ThemedText.BodyPrimary>
          <StyledDropDown />
        </SelectedOption>
      </Selector>

      <Menu show={showDropdown}>
        <ThemedText.SubHeaderSmall>Expiry</ThemedText.SubHeaderSmall>
        <OptionsContainer>
          {EXPIRY_OPTIONS.map((option) => (
            <Option onClick={() => onSelectOption(option)} key={option}>
              <ThemedText.BodyPrimary>{option}</ThemedText.BodyPrimary>
              {selected === option && <CheckIcon />}
            </Option>
          ))}
        </OptionsContainer>
      </Menu>
    </ExpirySection>
  )
}

const ExpirySection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  display: flex;
  align-items: flex-start;
  flex-flow: column;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  // height: 50px;
  line-height: 20px;

  flex: 0.6;
  min-height: 70px;

  div {
    text-align: left;
  }
`

const OptionsContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 12px;

  margin: -4px;
`

const SelectedOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Option = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 12px;
  padding: 4px;

  display: flex;
  flex-flow: row;
  align-items: center;
  justify-content: space-between;

  &:hover {
    opacity: 0.8;
  }
`

const CheckIcon = styled(Check)`
  height: 20px;
  width: 20px;
  margin-left: 4px;
  color: ${({ theme }) => theme.accent1};
`

const Selector = styled.button<{ show: boolean }>`
  padding: 17px;
  border: none;
  cursor: pointer;
  background: none;

  ${({ show }) => (!show ? 'pointer-events: none;' : '')}

  display: flex;
  flex-flow: column;
  align-items: stretch;
  width: 100%;
`

const Menu = styled.div<{ show: boolean }>`
  position: absolute;

  background-color: ${({ theme }) => theme.surface2};
  display: ${({ show }) => (show ? 'flex' : 'none')};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.deprecated_stateOverlayHover};
  flex-flow: column;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  // height: 50px;
  line-height: 20px;
  padding: 16px;
  width: 100%;
  gap: 12px;
`

const StyledDropDown = styled(DropDown)`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;
  margin-left: 8px;

  path {
    stroke: ${({ theme }) => theme.white};
    stroke-width: 2px;
  }
`
