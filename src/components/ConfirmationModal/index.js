import React from 'react'
import styled from 'styled-components'

import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Row, { RowBetween, RowFlat, RowFixed } from '../Row'
import { ArrowDown } from 'react-feather'

import { ButtonConfirmed } from '../Button'
import { Text } from 'rebass'
import { LightCard } from '../Card'
import Modal from '../Modal'
import { CheckCircle } from 'react-feather'
import DoubleTokenLogo from '../DoubleLogo'
import TokenLogo from '../TokenLogo'
import { CloseIcon } from '../../theme/components'
import Loader from '../Loader'
import { Link } from '../../theme'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'
import { TRANSACTION_TYPE } from '../../constants'

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

const ConfirmedText = styled(Text)`
  color: ${({ theme, confirmed }) => (confirmed ? theme.connectedGreen : theme.white)};
`

export default function ConfirmationModal({
  isOpen,
  onDismiss,
  liquidityAmount = undefined,
  poolTokenPercentage = undefined,
  amount0,
  amount1,
  price,
  transactionType,
  pendingConfirmation,
  hash,
  signed = false,
  contractCall,
  attemptedRemoval = false,
  extraCall = undefined
}) {
  const { address: address0, symbol: symbol0 } = amount0?.token || {}
  const { address: address1, symbol: symbol1 } = amount1?.token || {}

  const { chainId } = useWeb3React()

  function WrappedOnDismissed() {
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={WrappedOnDismissed}>
      {!attemptedRemoval ? (
        <Wrapper>
          <Section gap="40px">
            <RowBetween>
              <Text fontWeight={500} fontSize={'20px'}>
                {transactionType === TRANSACTION_TYPE.SWAP ? 'Confirm Swap' : 'You will receive'}
              </Text>
              <CloseIcon onClick={WrappedOnDismissed} />
            </RowBetween>
            {transactionType === TRANSACTION_TYPE.SWAP && (
              <AutoColumn gap={'20px'}>
                <LightCard>
                  <RowBetween>
                    <Text fontSize={24} fontWeight={500}>
                      {amount0?.toSignificant(6)}
                    </Text>
                    <RowFixed gap="10px">
                      <TokenLogo address={amount0?.token?.address} size={'24px'} />
                      <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                        {symbol0}
                      </Text>
                    </RowFixed>
                  </RowBetween>
                </LightCard>
                <ColumnCenter>
                  <ArrowDown size="16" color="#888D9B" />
                </ColumnCenter>
                <LightCard>
                  <RowBetween>
                    <Text fontSize={24} fontWeight={500}>
                      {amount1?.toSignificant(6)}
                    </Text>
                    <RowFixed gap="10px">
                      <TokenLogo address={amount1?.token?.address} size={'24px'} />
                      <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                        {symbol1}
                      </Text>
                    </RowFixed>
                  </RowBetween>
                </LightCard>
              </AutoColumn>
            )}
            {transactionType === TRANSACTION_TYPE.ADD && (
              <AutoColumn gap="16px">
                <RowFlat>
                  <Text fontSize="48px" fontWeight={500} lineHeight="32px" marginRight={10}>
                    {liquidityAmount?.toFixed(6)}
                  </Text>
                  <DoubleTokenLogo a0={address0 || ''} a1={address1 || ''} size={20} />
                </RowFlat>
                <Row>
                  <Text fontSize="24px">{symbol0 + ':' + symbol1 + ' Pool Tokens'}</Text>
                </Row>
              </AutoColumn>
            )}
            {transactionType === TRANSACTION_TYPE.REMOVE && (
              <AutoColumn gap="16px">
                <Row>
                  <TokenLogo address={address0} size={'30px'} />
                  <Text fontSize="24px" marginLeft={10}>
                    {symbol0} {amount0?.toSignificant(8)}
                  </Text>
                </Row>
                <Row>
                  <TokenLogo address={address1} size={'30px'} />
                  <Text fontSize="24px" marginLeft={10}>
                    {symbol1} {amount1?.toSignificant(8)}
                  </Text>
                </Row>
              </AutoColumn>
            )}
          </Section>
          <BottomSection gap="12px">
            <AutoColumn gap="12px">
              {transactionType === TRANSACTION_TYPE.ADD && (
                <>
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
                </>
              )}
              {transactionType === TRANSACTION_TYPE.REMOVE && (
                <RowBetween>
                  <Text color="#565A69" fontWeight={500} fontSize={16}>
                    {'UNI ' + symbol0 + ':' + symbol1} Burned
                  </Text>
                  <RowFixed>
                    <DoubleTokenLogo a0={address0 || ''} a1={address1 || ''} margin={true} />
                    <Text fontWeight={500} fontSize={16}>
                      {liquidityAmount?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                </RowBetween>
              )}
              {price && price?.adjusted && (
                <RowBetween>
                  <Text color="#565A69" fontWeight={500} fontSize={16}>
                    Rate
                  </Text>
                  <Text fontWeight={500} fontSize={16}>
                    {`1 ${symbol0} = ${price.adjusted.toFixed(8)} ${symbol1}`}
                  </Text>
                </RowBetween>
              )}
              {transactionType === TRANSACTION_TYPE.ADD && poolTokenPercentage && (
                <RowBetween>
                  <Text color="#565A69" fontWeight={500} fontSize={16}>
                    Minted Pool Share:
                  </Text>
                  <Text fontWeight={500} fontSize={16}>
                    {poolTokenPercentage?.toFixed(6) + '%'}
                  </Text>
                </RowBetween>
              )}
              {transactionType === TRANSACTION_TYPE.REMOVE ? (
                <RowBetween gap="20px">
                  <ButtonConfirmed
                    style={{ margin: '20px 0' }}
                    width="48%"
                    onClick={() => {
                      extraCall()
                    }}
                    confirmed={signed}
                    disabled={signed}
                  >
                    <ConfirmedText fontWeight={500} fontSize={20} confirmed={signed}>
                      {signed ? 'Signed' : 'Sign'}
                    </ConfirmedText>
                  </ButtonConfirmed>
                  <ButtonPrimary
                    width="48%"
                    disabled={!signed}
                    style={{ margin: '20px 0' }}
                    onClick={() => {
                      contractCall()
                    }}
                  >
                    <Text fontWeight={500} fontSize={20}>
                      Confirm Remove
                    </Text>
                  </ButtonPrimary>
                </RowBetween>
              ) : (
                <ButtonPrimary
                  style={{ margin: '20px 0' }}
                  onClick={() => {
                    contractCall()
                  }}
                >
                  <Text fontWeight={500} fontSize={20}>
                    Confirm{' '}
                    {transactionType === TRANSACTION_TYPE.ADD
                      ? 'Supply'
                      : transactionType === TRANSACTION_TYPE.REMOVE
                      ? 'Remove'
                      : 'Swap'}
                  </Text>
                </ButtonPrimary>
              )}
              {transactionType === TRANSACTION_TYPE.ADD && (
                <Text fontSize={12} color="#565A69" textAlign="center">
                  {`Output is estimated. You will receive at least ${liquidityAmount?.toFixed(
                    6
                  )} UNI ${symbol0}/${symbol1} or the transaction will revert.`}
                </Text>
              )}
              {transactionType === TRANSACTION_TYPE.REMOVE && (
                <Text fontSize={12} color="#565A69" textAlign="center">
                  {`Output is estimated. You will receive at least ${amount0?.toSignificant(
                    6
                  )} ${symbol0} at least ${amount1?.toSignificant(6)} ${symbol1} or the transaction will revert.`}
                </Text>
              )}
              {transactionType === TRANSACTION_TYPE.SWAP && (
                <Text fontSize={12} color="#565A69" textAlign="center">
                  {`Output is estimated. You will receive at least ${amount1?.toSignificant(
                    6
                  )} ${symbol1}  or the transaction will revert.`}
                </Text>
              )}
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
              {pendingConfirmation ? <Loader size="90px" /> : <CheckCircle size={90} color="#27AE60" />}
            </ConfirmedIcon>
            <AutoColumn gap="24px" justify={'center'}>
              <Text fontWeight={500} fontSize={20}>
                {!pendingConfirmation ? 'Transaction Submitted' : 'Waiting For Confirmation'}
              </Text>
              <AutoColumn gap="12px" justify={'center'}>
                <Text fontWeight={500} fontSize={16} color="#2172E5">
                  {transactionType === TRANSACTION_TYPE.ADD
                    ? 'Supplied'
                    : transactionType === TRANSACTION_TYPE.REMOVE
                    ? 'Removed'
                    : 'Swapped'}
                </Text>
                <Text fontWeight={600} fontSize={16} color="#2172E5">
                  {`${amount0?.toSignificant(6)} ${symbol0} ${
                    transactionType === TRANSACTION_TYPE.SWAP ? 'for' : 'and'
                  } ${amount1?.toSignificant(6)} ${symbol1}`}
                </Text>
              </AutoColumn>
              {!pendingConfirmation && (
                <>
                  <Link href={getEtherscanLink(chainId, hash, 'transaction')}>
                    <Text fontWeight={500} fontSize={14} color="#2172E5">
                      View on Etherscan
                    </Text>
                  </Link>
                  <ButtonPrimary onClick={WrappedOnDismissed} style={{ margin: '20px 0' }}>
                    <Text fontWeight={500} fontSize={20}>
                      Close
                    </Text>
                  </ButtonPrimary>
                </>
              )}
              {pendingConfirmation && <div style={{ height: '138px' }} />}
              <Text fontSize={12} color="#565A69">
                {pendingConfirmation
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
