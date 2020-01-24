import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { useWeb3React } from '../../hooks'
import { useTokenDetails } from '../../contexts/Tokens'
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
  right: 140px;
  top: 4px;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1rem;
  line-height: 150%;
  background: #f7f8fa;
  border: 1px solid ${({ theme }) => theme.mercuryGray};
  border-radius: 8px;
  animation: ${fadeIn} 0.15s linear;
  color: ${({ theme }) => theme.textColor};
  font-style: italic;

  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.04);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 2px;
    top: 50px;
  `}
`

function WarningCard({ onDismiss, inputCurrency, outputCurrency, newInputDetected, newOutputDetected }) {
  const [showPopup, setPopup] = useState(false)
  const { chainId } = useWeb3React()
  // get decimals and exchange address for each of the currency types
  const { symbol: inputSymbol, name: inputName } = useTokenDetails(inputCurrency)
  const { symbol: outputSymbol, name: outputName } = useTokenDetails(outputCurrency)

  return (
    <Wrapper>
      <CloseIcon onClick={() => onDismiss()}>
        <CloseColor alt={'close icon'} />
      </CloseIcon>
      <Row style={{ fontSize: '12px' }}>
        Unverified Token{' '}
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
            Exchanges can be created by anyone using the factory contract and loaded into this interface by a URL. If
            you are loading this site from a referral link, check the source and verify the token on etherscan before
            making any transactions.
          </Popup>
        ) : (
          ''
        )}
      </Row>
      {newInputDetected && (
        <Row>
          <TokenLogo address={inputCurrency} />
          <div style={{ fontWeight: 500 }}>
            {inputName} ({inputSymbol})
          </div>
          <Link style={{ fontWeight: 400 }} href={getEtherscanLink(chainId, inputCurrency, 'address')}>
            (View on Etherscan)
          </Link>
        </Row>
      )}
      {newOutputDetected && (
        <Row>
          <TokenLogo address={outputCurrency} />
          <div style={{ fontWeight: 500 }}>
            {outputName} ({outputSymbol})
          </div>
          <Link style={{ fontWeight: 400 }} href={getEtherscanLink(chainId, outputCurrency, 'address')}>
            (View on Etherscan)
          </Link>
        </Row>
      )}
      <Row style={{ fontSize: '12px', fontStyle: 'italic', color: '#2B2B2B' }}>
        Anyone can create an exchange for any token. Please verify the legitimacy of these tokens before making any
        transactions.
      </Row>
    </Wrapper>
  )
}

export default WarningCard
