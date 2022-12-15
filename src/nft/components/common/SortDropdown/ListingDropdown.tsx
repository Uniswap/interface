import { ThemedText } from 'theme'
import styled from 'styled-components'
import { ChevronDown } from 'react-feather'
import { DropDownOption } from 'nft/types'
import { useState } from 'react'

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
  width: 92px;
  margin-left: 4px;
  // padding-left: 8px
  height: 20px;
  cursor: pointer;
  padding-left: 8px;
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
  width: 115px;
  justify-content: center;
  border-radius: 12px;
  margin-top: 8px;
  border-radius: 12px;
`

const DropdownOption = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 12px;
  padding-bottom: 12px;
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;

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

  return (
    <>
      <DropdownContainer onClick={() => setIsOpen(!isOpen)}>
        <ThemedText.Caption color="textSecondary">Price: </ThemedText.Caption>{' '}
        <DropdownOptionButton>
          {dropdownText} <ChevronDown size={16} />
        </DropdownOptionButton>
      </DropdownContainer>

      {isOpen && (
        <DropdownOptionsContainer>
          <DropdownOptionsContainerTwo>
            {dropDownOptions.map((dropdownOption) => (
              <DropdownOption
                onClick={() => {
                  dropdownOption.onClick()
                  setIsOpen(false)
                  setDropdownText(dropdownOption.displayText)
                }}
              >
                {dropdownOption.displayText}
              </DropdownOption>
            ))}
          </DropdownOptionsContainerTwo>
        </DropdownOptionsContainer>
      )}
    </>
  )
}

export default ListingDropdown
