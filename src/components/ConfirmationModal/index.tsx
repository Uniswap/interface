import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Modal from '../Modal'
import { ExternalLink } from '../../theme'
import { Text } from 'rebass'
import { CloseIcon, Spinner } from '../../theme/components'
import { RowBetween } from '../Row'
import { ArrowUpCircle } from 'react-feather'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Circle from '../../assets/images/blue-loader.svg'

import { getEtherscanLink } from '../../utils'
import { useActiveWeb3React } from '../../hooks'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

const CustomLightSpinner = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string
  topContent: () => React.ReactChild
  bottomContent: () => React.ReactChild
  attemptingTxn: boolean
  pendingText: string
  title?: string
}

export default function ConfirmationModal({
  isOpen,
  onDismiss,
  topContent,
  bottomContent,
  attemptingTxn,
  hash,
  pendingText,
  title = ''
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const transactionBroadcast = !!hash

  // waiting for user to confirm/reject tx _or_ showing info on a tx that has been broadcast
  if (attemptingTxn || transactionBroadcast) {
    return (
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
        <Wrapper>
          <Section>
            <RowBetween>
              <div />
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
            <ConfirmedIcon>
              {transactionBroadcast ? (
                <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
              ) : (
                <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
              )}
            </ConfirmedIcon>
            <AutoColumn gap="12px" justify={'center'}>
              <Text fontWeight={500} fontSize={20}>
                {transactionBroadcast ? 'Transaction Submitted' : 'Waiting For Confirmation'}
              </Text>
              <AutoColumn gap="12px" justify={'center'}>
                <Text fontWeight={600} fontSize={14} color="" textAlign="center">
                  {pendingText}
                </Text>
              </AutoColumn>

              {transactionBroadcast ? (
                <>
                  <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
                    <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                      View on Etherscan
                    </Text>
                  </ExternalLink>
                  <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
                    <Text fontWeight={500} fontSize={20}>
                      Close
                    </Text>
                  </ButtonPrimary>
                </>
              ) : (
                <Text fontSize={12} color="#565A69" textAlign="center">
                  Confirm this transaction in your wallet
                </Text>
              )}
            </AutoColumn>
          </Section>
        </Wrapper>
      </Modal>
    )
  }

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <Wrapper>
        <Section>
          <RowBetween>
            <Text fontWeight={500} fontSize={20}>
              {title}
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          {topContent()}
        </Section>
        <BottomSection gap="12px">{bottomContent()}</BottomSection>
      </Wrapper>
    </Modal>
  )
}
