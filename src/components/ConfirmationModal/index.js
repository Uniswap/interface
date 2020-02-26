import React, { useState } from 'react'
import styled from 'styled-components'

import { ButtonPrimary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Row, { RowBetween, RowFlat, RowFixed } from '../Row'
import { Text } from 'rebass'
import Modal from '../Modal'
import { CheckCircle } from 'react-feather'
import DoubleTokenLogo from '../DoubleLogo'
import TokenLogo from '../TokenLogo'
import { CloseIcon } from '../../theme/components'
import Loader from '../Loader'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 2rem;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.activeGray};
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export default function ConfirmationModal({
  isOpen,
  onDismiss,
  liquidityMinted,
  amount0,
  amount1,
  poolTokenPercentage,
  price
}) {
  const { address: address0, symbol: symbol0 } = amount0?.token || {}
  const { address: address1, symbol: symbol1 } = amount1?.token || {}

  const [confirmed, SetConfirmed] = useState(false)
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false)

  function WrappedOnDismissed() {
    onDismiss()
    SetConfirmed(false)
  }

  function fakeCall() {
    setTimeout(() => {
      setWaitingForConfirmation(false)
    }, 2000)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={100}>
      {!confirmed ? (
        <Wrapper>
          <Section gap="40px">
            <RowBetween>
              <Text fontWeight={500} fontSize={'20px'}>
                You will receive
              </Text>
              <CloseIcon onClick={WrappedOnDismissed} />
            </RowBetween>
            <AutoColumn gap="16px">
              <RowFlat>
                <Text fontSize="48px" fontWeight={500} lineHeight="32px" marginRight={10}>
                  {liquidityMinted?.toFixed(6)}
                </Text>
                <DoubleTokenLogo a0={address0 || ''} a1={address1 || ''} size={20} />
              </RowFlat>
              <Row>
                <Text fontSize="24px">{symbol0 + ':' + symbol1 + ' Pool Tokens'}</Text>
              </Row>
            </AutoColumn>
          </Section>
          <BottomSection gap="12px">
            {/* <Text fontWeight={500} fontSize={16}>
            Deposited Tokens
          </Text> */}
            {/* <LightCard>
            <RowBetween>
              <Text fontWeight={500} fontSize={20}>
                {amountFormatter(amount0, decimals0, 4)}
              </Text>
              <RowFixed>
                <TokenLogo address={token0 || ''} size={'24px'} />
                <Text fontWeight={500} fontSize={20} marginLeft="12px">
                  {symbol0}
                </Text>
              </RowFixed>
            </RowBetween>
          </LightCard>
          <ColumnCenter>
            <Plus size="16" color="#888D9B" />
          </ColumnCenter>
          <LightCard>
            <RowBetween>
              <Text fontWeight={500} fontSize={20}>
                {amountFormatter(amount1, decimals1, 4)}
              </Text>
              <RowFixed>
                <TokenLogo address={token1 || ''} size={'24px'} />
                <Text fontWeight={500} fontSize={16} marginLeft="12px">
                  {symbol1}
                </Text>
              </RowFixed>
            </RowBetween>
          </LightCard> */}
            <AutoColumn gap="12px">
              <RowBetween>
                <Text color="#565A69" fontWeight={500} fontSize={16}>
                  {symbol0} Deposited
                </Text>
                <RowFixed>
                  <TokenLogo address={address0 || ''} style={{ marginRight: '8px' }} />
                  <Text fontWeight={500} fontSize={16}>
                    {amount0?.toSignificant(6)}
                  </Text>
                </RowFixed>
              </RowBetween>
              <RowBetween>
                <Text color="#565A69" fontWeight={500} fontSize={16}>
                  {symbol1} Deposited
                </Text>
                <RowFixed>
                  <TokenLogo address={address1 || ''} style={{ marginRight: '8px' }} />
                  <Text fontWeight={500} fontSize={16}>
                    {amount1?.toSignificant(6)}
                  </Text>
                </RowFixed>
              </RowBetween>
              <RowBetween>
                <Text color="#565A69" fontWeight={500} fontSize={16}>
                  Rate
                </Text>
                <Text fontWeight={500} fontSize={16}>
                  {price && `1 ${symbol0} = ${price?.adjusted.toFixed(8)} ${symbol1}`}
                </Text>
              </RowBetween>
              <RowBetween>
                <Text color="#565A69" fontWeight={500} fontSize={16}>
                  Minted Pool Share:
                </Text>
                <Text fontWeight={500} fontSize={16}>
                  {poolTokenPercentage?.toFixed(6) + '%'}
                </Text>
              </RowBetween>
              <ButtonPrimary
                style={{ margin: '20px 0' }}
                onClick={() => {
                  setWaitingForConfirmation(true)
                  SetConfirmed(true)
                  fakeCall()
                }}
              >
                <Text fontWeight={500} fontSize={20}>
                  Confirm Supply
                </Text>
              </ButtonPrimary>
              <Text fontSize={12} color="#565A69" textAlign="center">
                {`Output is estimated. You will receive at least ${liquidityMinted?.toFixed(
                  6
                )} UNI ${symbol0}/${symbol1} or the transaction will revert.`}
              </Text>
            </AutoColumn>
          </BottomSection>
        </Wrapper>
      ) : (
        <Wrapper>
          <Section>
            <RowBetween>
              <div />
              <CloseIcon onClick={WrappedOnDismissed} />
            </RowBetween>
            <ConfirmedIcon>
              {waitingForConfirmation ? <Loader size="90px" /> : <CheckCircle size={90} color="#27AE60" />}
            </ConfirmedIcon>
            <AutoColumn gap="24px" justify={'center'}>
              <Text fontWeight={500} fontSize={20}>
                {!waitingForConfirmation ? 'Transaction Submitted' : 'Waiting For Confirmation'}
              </Text>
              <AutoColumn gap="12px" justify={'center'}>
                <Text fontWeight={500} fontSize={16} color="#2172E5">
                  Supplied
                </Text>
                <Text fontWeight={600} fontSize={16} color="#2172E5">
                  {`${amount0?.toSignificant(6)} ${symbol0} and ${amount1?.toSignificant(6)} ${symbol1}`}
                </Text>
              </AutoColumn>
              {!waitingForConfirmation && (
                <>
                  <Text fontWeight={500} fontSize={14} color="#2172E5">
                    View on Etherscan
                  </Text>
                  <ButtonPrimary onClick={WrappedOnDismissed} style={{ margin: '20px 0' }}>
                    <Text fontWeight={500} fontSize={20}>
                      Close
                    </Text>
                  </ButtonPrimary>
                </>
              )}
              {waitingForConfirmation && <div style={{ height: '138px' }} />}
              <Text fontSize={12} color="#565A69">
                {waitingForConfirmation
                  ? 'Confirm this transaction in your wallet'
                  : `Estimated time until confirmation: 3 min`}
              </Text>
            </AutoColumn>
          </Section>
        </Wrapper>
      )}
    </Modal>
  )
}
