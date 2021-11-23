import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import styled from 'styled-components/macro'

// const Main = styled('div')`
//   font-family: sans-serif;
//   background: #f0f0f0;
//   height: 100vh;
// `

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

// const DropDownHeader = styled('div')`
//   margin-bottom: 0.4em;
//   margin-top: 0.4em;
//   padding: 0.4em 2em 0.4em 1em;
//   //border-radius: 1.25rem;
//   //box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
//   font-weight: 500;
//   font-size: 1.3rem;
//   color: #3faffa;
//   // background-color: ${({ theme }) => theme.bg1};
//   width: 100%;
// `

const DropDownHeader = styled.button`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: transparent;
  margin: 0;
  border: none;
  display: flex;
  flex: 1;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
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
  //top: 3rem;
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
  //border: 2px solid #e5e5e5;
  box-sizing: border-box;
  color: #3faffa;
  font-size: 1.3rem;
  font-weight: 500;
  &:first-child {
    padding-top: 0.8em;
  }
  // background-color: ${({ theme }) => theme.bg1};
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

// const ListItem = styled('li')`
//   list-style: none;
//   margin-bottom: 0.8em;
//   color: ${({ theme }) => theme.text2};
//   :hover {
//     color: ${({ theme }) => theme.text1};
//     cursor: pointer;
//     text-decoration: none;
//   }
//   padding: 0.5rem 0.5rem;
//   font-size: 1.25rem;
// `

const faucetTokens = [
  {
    name: <Trans>UzhUniToken</Trans>,
    address: '0xE771E7A06abDC5176C9D20365c844680dC75b173',
    logo: '',
  },
  {
    name: <Trans>UZHSushi</Trans>,
    address: '0x8182965A5dC302e6b25b2b177c7CCa42C5099795',
    logo: '',
  },
  {
    name: <Trans>UZHCro</Trans>,
    address: '0x90aF2F7f19A93fc80D4F983218C56Bc2f8544989',
    logo: '',
  },
  {
    name: <Trans>Incoingnito</Trans>,
    address: '0xEe9E427945A073c9C8801dC5da44a276aF339333',
    logo: '',
  },
  {
    name: <Trans>Intellicoin</Trans>,
    address: '0x2A35E060849Fa56Ba648C93a50E23359b5d14515',
    logo: '',
  },
  {
    name: <Trans>Privatepedia</Trans>,
    address: '0x5e1bcb66D6CbFA4F98bB63BaF4357a543232BFbc',
    logo: '',
  },
  {
    name: <Trans>Coinicious</Trans>,
    address: '0xC486C817bE36F9ccf257BfF86CC33ff71a69D651',
    logo: '',
  },
  {
    name: <Trans>Cryptofficialcoin</Trans>,
    address: '0xd0b00725255C35514A8d702b4B4F78C141E8B5eF',
    logo: '',
  },
]

export default function FaucetDropDown() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(faucetTokens[0].name)

  const toggling = () => setIsOpen(!isOpen)

  const onOptionClicked = (value: JSX.Element) => () => {
    setSelectedOption(value)
    setIsOpen(false)
    console.log(selectedOption)
  }

  return (
    <DropDownContainer>
      <div style={{ width: '100%' }}>
        <DropDownHeader onClick={toggling}>
          {(
            <span style={{ width: '100%', textAlign: 'left', padding: '8px', position: 'relative' }}>
              {selectedOption}
            </span>
          ) || <span>Ethereum</span>}
        </DropDownHeader>
        {isOpen && (
          <DropDownListContainer>
            <DropDownList>
              {faucetTokens.map((token) => (
                <ListItem onClick={onOptionClicked(token.name)} key={Math.random()}>
                  {/*<Trans id={Math.random()}>{option}</Trans>*/}
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
