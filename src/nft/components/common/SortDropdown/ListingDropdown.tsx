import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { CheckMarkIcon } from 'nft/components/icons'
import { DropDownOption } from 'nft/types'
import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const DropdownContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: left;
`

const DropdownOptionButton = styled.span`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  color: ${({ theme }) => theme.textPrimary};
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding-right: 8px;
  margin-left: 4px;
  height: 20px;
  cursor: pointer;
  padding-left: 8px;
  user-select: none;
`

const DropdownOptionsContainer = styled.div`
  position: relative;
`

const DropdownOptionsContainerTwo = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  left: 0;
  background-color: ${({ theme }) => theme.backgroundModule};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  z-index: 1;
  width: 160px;
  justify-content: center;
  border-radius: 12px;
  margin-top: 8px;
  border-radius: 12px;
`

const StyledCheckmark = styled(CheckMarkIcon)`
  height: 16px;
  width: 16px;
  margin-left: 8px;
  color: ${({ theme }) => theme.accentAction};
`

const DropdownOption = styled.div`
  display: flex;
  padding-top: 12px;
  padding-bottom: 12px;
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;
  padding-left: 16px;
  padding-right: 16px;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
  }

  &:first-child {
    border-top-right-radius: 12px;
    border-top-left-radius: 12px;
  }

  &:last-child {
    border-bottom-right-radius: 12px;
    border-bottom-left-radius: 12px;
  }
`

const ListingDropdown = ({ dropDownOptions }: { dropDownOptions: DropDownOption[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownText, setDropdownText] = useState('Custom')
  const ref = useRef(null)

  useOnClickOutside(ref, () => setIsOpen(false))

  return (
    <div ref={ref}>
      <DropdownContainer onClick={() => setIsOpen(!isOpen)}>
        <ThemedText.Caption color="textSecondary">Price: </ThemedText.Caption>{' '}
        <DropdownOptionButton>
          {dropdownText} {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </DropdownOptionButton>
      </DropdownContainer>

      {isOpen && (
        <DropdownOptionsContainer>
          <DropdownOptionsContainerTwo>
            {dropDownOptions.map((dropdownOption) => (
              <DropdownOption
                key={dropdownOption.displayText}
                onClick={() => {
                  dropdownOption.onClick()
                  setIsOpen(false)
                  setDropdownText(dropdownOption.displayText)
                }}
              >
                {dropdownOption.displayText} {dropdownText === dropdownOption.displayText && <StyledCheckmark />}
              </DropdownOption>
            ))}
          </DropdownOptionsContainerTwo>
        </DropdownOptionsContainer>
      )}
    </div>
  )
}

export default ListingDropdown
