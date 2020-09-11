import { BigNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import React, { useCallback, useContext, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import CRO_ICON from '../../assets/images/cro-icon.png'
import { Field } from '../../constants/stakeContractAddress'
import { useCROStakeContract } from '../../hooks/useContract'
import { StakeContractAddressMapper } from '../../state/stake/hooks'
import { CloseIcon } from '../../theme/components'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'

interface UnstakeModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakeAmount: BigNumber | undefined
  terms: Field | undefined
}

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  font-size: 0.75rem;
  line-height: 1rem;
`
const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const StyledText = styled.div<{ size?: number }>`
  font-size: ${({ size }) => (size ? `${size}px` : '24px')};
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const StyledIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`

interface UnstakeModalState {
  isOpenConfirm: boolean
  attemptingTxn: boolean
  txHash: string | undefined
  stakeErrorMessage: string | undefined
}

interface Action extends Partial<UnstakeModalState> {
  type: 'attemptingTxn' | 'rejected' | 'attempted' | 'init' | 'attempt_failed'
}

const initialState: UnstakeModalState = {
  isOpenConfirm: false,
  attemptingTxn: false,
  stakeErrorMessage: undefined,
  txHash: undefined
}

function reducer(state: UnstakeModalState, action: Action): UnstakeModalState {
  switch (action.type) {
    case 'init':
      return initialState

    case 'attemptingTxn':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: true,
        stakeErrorMessage: undefined,
        txHash: undefined
      }

    case 'attempted':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: false,
        stakeErrorMessage: undefined,
        txHash: action.txHash
      }

    case 'attempt_failed':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: false,
        txHash: undefined,
        stakeErrorMessage: action.stakeErrorMessage
      }

    default:
      throw new Error(`Unknown state ${action.type}`)
  }
}

export const UnstakeModal = ({ isOpen, onDismiss, terms, stakeAmount }: UnstakeModalProps) => {
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const contract = useCROStakeContract(StakeContractAddressMapper(terms || Field.ONE_YEAR), true)
  const theme = useContext(ThemeContext)
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!isOpen) return
    dispatch({ type: 'init' })
  }, [isOpen, dispatch])
  const unstakeCb = useCallback(async () => {
    if (typeof stakeAmount === 'undefined') throw new Error('Unstake amount cannot be undefined')

    dispatch({ type: 'attemptingTxn' })

    await contract
      ?.unstake(stakeAmount.toString(), Buffer.from('test'))
      .then((result: TransactionResponse) => {
        addTransaction(result, {
          summary: `Unstaking ${formatUnits(stakeAmount, 8)} CRO for ${t(terms)}`
        })
        dispatch({
          type: 'attempted',
          txHash: result.hash
        })
      })
      .catch((error: Error) => {
        console.error(error)
        dispatch({
          type: 'attempt_failed',
          stakeErrorMessage: error.message
        })
      })
  }, [dispatch, stakeAmount, contract, addTransaction])

  async function onApproval(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault()
    await unstakeCb()
  }

  const onBeforeDismiss = useCallback(() => {
    dispatch({ type: 'init' })
    onDismiss()
  }, [dispatch, onDismiss])

  const confirmationContent = useCallback(
    () =>
      state.stakeErrorMessage ? (
        <TransactionErrorContent onDismiss={onBeforeDismiss} message={state.stakeErrorMessage} />
      ) : (
        <div />
      ),
    [onDismiss, state.stakeErrorMessage]
  )

  const formattedStake = stakeAmount ? formatUnits(stakeAmount, 8) : '0'

  return (
    <>
      <TransactionConfirmationModal
        isOpen={state.isOpenConfirm}
        onDismiss={onBeforeDismiss}
        attemptingTxn={state.attemptingTxn}
        hash={state.txHash}
        content={confirmationContent}
        pendingText={state.isOpenConfirm ? `${t('unstaking_cro_pending')} ${formattedStake} CRO` : ''}
      />
      <Modal isOpen={isOpen} maxHeight={90} onDismiss={onBeforeDismiss}>
        <Wrapper>
          <Section>
            <RowBetween>
              <StyledText size={22}>{t('unstake_modal_title')}</StyledText>
              <CloseIcon onClick={onBeforeDismiss} />
            </RowBetween>
          </Section>

          <Section>
            <AutoColumn gap="lg">
              <RowBetween>
                <StyledText size={32}>{formattedStake}</StyledText>
                <StyledText size={20}>
                  <StyledIcon src={CRO_ICON} alt="" /> CRO
                </StyledText>
              </RowBetween>

              <RowBetween>
                <div>
                  <LabelRow theme={theme}>
                    <StyledText size={14}>{t('stake_page_stake_period')}</StyledText>
                  </LabelRow>
                  <StyledText>{t(terms)}</StyledText>
                </div>
              </RowBetween>
              <ButtonPrimary id="stake_modal_btn_approval" style={{ padding: 16 }} onClick={onApproval}>
                <Text fontWeight={500} fontSize={20}>
                  {t('unstaking_modal_btn_approval')}
                </Text>
              </ButtonPrimary>
            </AutoColumn>
          </Section>
        </Wrapper>
      </Modal>
    </>
  )
}

export default UnstakeModal
