import React, { useState } from 'react'
import styled from 'styled-components/macro'

interface DropDownProps {
  currentToken: string
  updateCurrentToken: React.Dispatch<React.SetStateAction<string>>
  updateSelectedTokenAddress: React.Dispatch<React.SetStateAction<string>>
  availableTokens: { address: string; name: string; logo: string }[]
}

const DropDownContainer = styled('div')`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  width: 100%;
  margin: 0 auto;
  text-align: left;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
`

const DropDownHeader = styled.button`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: transparent;
  margin: 0;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.bg2};
  display: flex;
  flex: 1;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text1};
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

const DropDownListContainer = styled('div')`
  position: absolute;
  width: 100%;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border: 1px solid ${({ theme }) => theme.bg0};
  border-radius: 1.25rem;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    bottom: unset;
    right: 0;
    left: unset;
  `};
`

const DropDownList = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  margin: 0;
  padding-left: 1em;
  box-sizing: border-box;
  color: #3faffa;
  font-size: 1.3rem;
  font-weight: 500;
  &:first-child {
    padding-top: 0.8em;
  }
`

const ListItem = styled('span')`
  list-style: none;
  margin-bottom: 0.8em;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  padding: 0.5rem 0.5rem;
  font-size: 1.25rem;
`

export default function FaucetDropDown({
  currentToken,
  updateCurrentToken,
  updateSelectedTokenAddress,
  availableTokens,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(currentToken)

  const toggling = () => setIsOpen(!isOpen)

  const onOptionClicked = (value: { name: string; address: string; logo: string }) => () => {
    setSelectedOption(value.name)
    setIsOpen(false)

    updateCurrentToken(value.name)
    updateSelectedTokenAddress(value.address)
  }

  return (
    <DropDownContainer>
      <div style={{ width: '100%' }}>
        <DropDownHeader onClick={toggling}>
          {
            <span style={{ width: '100%', textAlign: 'left', padding: '8px', position: 'relative' }}>
              {selectedOption}
            </span>
          }
        </DropDownHeader>
        {isOpen && (
          <DropDownListContainer>
            <DropDownList>
              {availableTokens.map((token: { name: string; address: string; logo: string }) => (
                <ListItem onClick={onOptionClicked(token)} key={Math.random()}>
                  <span>{token.name}</span>
                </ListItem>
              ))}
            </DropDownList>
          </DropDownListContainer>
        )}
      </div>
    </DropDownContainer>
  )
}
