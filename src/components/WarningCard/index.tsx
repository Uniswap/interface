import { Token } from '@uniswap/sdk'
import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { getEtherscanLink } from '../../utils'

import { Link } from '../../theme'
import TokenLogo from '../TokenLogo'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import question from '../../assets/images/question.svg'

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`

const Wrapper = styled.div`
  background: rgba(243, 190, 30, 0.1);
  position: relative;
  padding: 1rem;
  border: 0.5px solid #f3be1e;
  border-radius: 10px;
  margin-bottom: 20px;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-row-gap: 10px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-items: flex-start;
  & > * {
    margin-right: 6px;
  }
`

const CloseColor = styled(Close)`
  color: #aeaeae;
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }

  & > * {
    height: 14px;
    width: 14px;
  }
`

const QuestionWrapper = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  margin-left: 0.4rem;
  padding: 0.2rem;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;

  :hover,
  :focus {
    opacity: 0.7;
  }
`

const HelpCircleStyled = styled.img`
  height: 18px;
  width: 18px;
`

const fadeIn = keyframes`
  from {
    opacity : 0;
  }

  to {
    opacity : 1;
  }
`

const Popup = styled(Flex)`
  position: absolute;
  width: 228px;
  right: 110px;
  top: 4px;
  z-index: 10;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 8px;
  animation: ${fadeIn} 0.15s linear;
  color: ${({ theme }) => theme.text1};
  font-style: italic;

  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 2px;
    top: 50px;
  `}
`

const Text = styled.div`
  color: ${({ theme }) => theme.text1};
`

interface WarningCardProps {
  onDismiss: () => void
  urlAddedTokens: Token[]
  currency: string
}

export default function WarningCard({ onDismiss, urlAddedTokens, currency }: WarningCardProps) {
  const [showPopup, setPopup] = useState<boolean>(false)
  const { chainId } = useActiveWeb3React()
  const { symbol: inputSymbol, name: inputName } = useToken(currency)
  const fromURL = urlAddedTokens.hasOwnProperty(currency)

  return (
    <Wrapper>
      <CloseIcon onClick={() => onDismiss()}>
        <CloseColor />
      </CloseIcon>
      <Row style={{ fontSize: '12px' }}>
        <Text>{fromURL ? 'Token imported by URL ' : 'Token imported by user'}</Text>
        <QuestionWrapper
          onClick={() => {
            setPopup(!showPopup)
          }}
          onMouseEnter={() => {
            setPopup(true)
          }}
          onMouseLeave={() => {
            setPopup(false)
          }}
        >
          <HelpCircleStyled src={question} alt="popup" />
        </QuestionWrapper>
        {showPopup ? (
          <Popup>
            <Text>
              The Uniswap V2 smart contracts are designed to support any ERC20 token on Ethereum. Any token can be
              loaded into the interface by entering its Ethereum address into the search field or passing it as a URL
              parameter. Be careful when interacting with imported tokens as they have not been verified.
            </Text>
          </Popup>
        ) : (
          ''
        )}
      </Row>
      <Row>
        <TokenLogo address={currency} />
        <div style={{ fontWeight: 500 }}>{inputName && inputSymbol ? inputName + ' (' + inputSymbol + ')' : ''}</div>
        <Link style={{ fontWeight: 400 }} href={getEtherscanLink(chainId, currency, 'address')}>
          (View on Etherscan)
        </Link>
      </Row>
      <Row style={{ fontSize: '12px', fontStyle: 'italic' }}>
        <Text>Please verify the legitimacy of this token before making any transactions.</Text>
      </Row>
    </Wrapper>
  )
}
