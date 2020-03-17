import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { TokenAmount, JSBI } from '@uniswap/sdk'

import QR from '../../assets/svg/QR.svg'
import TokenLogo from '../../components/TokenLogo'

import SearchModal from '../../components/SearchModal'
import ExchangePage from '../../components/ExchangePage'
import NumericalInput from '../../components/NumericalInput'
import ConfirmationModal from '../../components/ConfirmationModal'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { LightCard } from '../../components/Card'
import { ArrowDown } from 'react-feather'
import { AutoColumn } from '../../components/Column'
import { ButtonPrimary } from '../../components/Button'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

import { useToken } from '../../contexts/Tokens'
import { RowBetween } from '../../components/Row'
import { useENSName } from '../../hooks'
import { useWeb3React } from '@web3-react/core'
import { useAddressBalance } from '../../contexts/Balances'

import { parseUnits } from '@ethersproject/units'
import { isAddress } from '../../utils'

const CurrencySelect = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 20px;
  width: ${({ selected }) => (selected ? '128px' : '180px')}
  padding: 8px 12px;
  background-color: ${({ selected, theme }) => (selected ? theme.buttonBackgroundPlain : theme.royalBlue)};
  color: ${({ selected, theme }) => (selected ? theme.textColor : theme.white)};
  border: 1px solid
    ${({ selected, theme }) => (selected ? theme.outlineGrey : theme.royalBlue)};
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  user-select: none;

  :hover {
    border: 1px solid
      ${({ selected, theme }) => (selected ? darken(0.1, theme.outlineGrey) : darken(0.1, theme.royalBlue))};
  }

  :focus {
    border: 1px solid  ${({ selected, theme }) =>
      selected ? darken(0.1, theme.outlineGrey) : darken(0.1, theme.royalBlue)};
  }

  :active {
    background-color: ${({ selected, theme }) => (selected ? theme.buttonBackgroundPlain : theme.royalBlue)};
  }
`

const StyledDropDown = styled(DropDown)`
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.textColor : theme.white)};
  }
`

const InputGroup = styled(AutoColumn)`
  position: relative;
  padding: 40px 0;
`

const QRWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.outlineGrey};
  background: #fbfbfb;
  padding: 4px;
  border-radius: 8px;
`

const StyledInput = styled.input`
  width: ${({ width }) => width};
  border: none;
  outline: none;
  font-size: 20px;

  ::placeholder {
    color: #edeef2;
  }
`

const StyledNumerical = styled(NumericalInput)`
  text-align: center;
  font-size: 48px;
  font-weight: 500px;
  width: 100%;

  ::placeholder {
    color: #edeef2;
  }
`

const MaxButton = styled.button`
  position: absolute;
  right: 70px;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.zumthorBlue};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.royalBlue};
  :hover {
    border: 1px solid ${({ theme }) => theme.royalBlue};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.royalBlue};
    outline: none;
  }
`

export default function Send() {
  const { account } = useWeb3React()

  // setting for send with swap or regular swap
  const [withSwap, setWithSwap] = useState(true)

  // modals
  const [modalOpen, setModalOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // token selected
  const [activeTokenAddress, setActiveTokenAddress] = useState()
  const token = useToken(activeTokenAddress)

  // user inputs
  const [typedValue, setTypedValue] = useState('')
  const [amount, setAmount] = useState(null)
  const [recipient, setRecipient] = useState('0x74Aa01d162E6dC6A657caC857418C403D48E2D77')

  //ENS
  const recipientENS = useENSName(recipient)

  // balances
  const userBalance = useAddressBalance(account, token)

  //errors
  const [generalError, setGeneralError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [recipientError, setRecipientError] = useState('')

  function parseInputAmount(newtypedValue) {
    setTypedValue(newtypedValue)
    if (!!token && newtypedValue !== '' && newtypedValue !== '.') {
      const typedValueParsed = parseUnits(newtypedValue, token.decimals).toString()
      setAmount(new TokenAmount(token, typedValueParsed))
    }
  }

  function onMax() {
    if (userBalance) {
      setTypedValue(userBalance.toExact())
      setAmount(userBalance)
    }
  }

  const atMax = amount && userBalance && JSBI.equal(amount.raw, userBalance.raw) ? true : false

  //error detection
  useEffect(() => {
    setGeneralError('')
    setRecipientError('')
    setAmountError('')

    if (!amount) {
      setGeneralError('Enter an amount')
    }
    if (!isAddress(recipient)) {
      setRecipientError('Enter a valid address')
    }
    if (!!!token) {
      setGeneralError('Select a token')
    }
    if (amount && userBalance && JSBI.greaterThan(amount.raw, userBalance.raw)) {
      setAmountError('Insufficient Balance')
    }
  }, [recipient, token, amount, userBalance])

  const TopContent = () => {
    return (
      <AutoColumn gap="30px" style={{ marginTop: '40px' }}>
        <RowBetween>
          <Text fontSize={36} fontWeight={500}>
            {amount?.toFixed(8)}
          </Text>
          <TokenLogo address={activeTokenAddress} size={'30px'} />
        </RowBetween>
        <ArrowDown size={24} color="#888D9B" />
        <TYPE.blue fontSize={36}>
          {recipient?.slice(0, 6)}...{recipient?.slice(36, 42)}
        </TYPE.blue>
      </AutoColumn>
    )
  }

  const BottomContent = () => {
    return (
      <AutoColumn>
        <ButtonPrimary>
          <Text color="white" fontSize={20}>
            Confirm send
          </Text>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const [attemptedSend, setAttemptedSend] = useState(false) // clicke confirm
  const [pendingConfirmation, setPendingConfirmation] = useState(true) // waiting for

  return withSwap ? (
    <ExchangePage sendingInput={true} />
  ) : (
    <>
      <SearchModal
        isOpen={modalOpen}
        onDismiss={() => {
          setModalOpen(false)
        }}
        filterType="tokens"
        onTokenSelect={tokenAddress => setActiveTokenAddress(tokenAddress)}
      />
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        hash=""
        title="Confirm Send"
        topContent={TopContent}
        bottomContent={BottomContent}
        attemptingTxn={attemptedSend}
        pendingConfirmation={pendingConfirmation}
        pendingText=""
      />
    </>
  )
}
