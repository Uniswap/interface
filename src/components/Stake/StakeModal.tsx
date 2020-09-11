import { parseUnits } from '@ethersproject/units'
import { darken } from 'polished'
import React, { useCallback, useContext, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { TokenAmount } from 'swap-sdk'
import CRO_ICON from '../../assets/images/cro-icon.png'
import CRO_TOKEN from '../../constants/croToken'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useCROStakeContract } from '../../hooks/useContract'
import { StakeContractAddressMapper } from '../../state/stake/hooks'
import { useActiveWeb3React } from '../../hooks'
import { CloseIcon, Loading } from '../../theme/components'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { useHistory } from 'react-router-dom'

const LIST_URL = process.env.REACT_APP_STAKE_LIST

interface StakeModalProps {
  isOpen: boolean
  onDismiss: () => void
  yearStake: string | undefined
  stakeAmount: string | undefined
}

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const StyledIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`

const StyledText = styled.div<{ size?: number }>`
  font-size: ${({ size }) => (size ? size + 'px' : '24px')};
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const PendingButton = styled.div`
  display: flex;
  min-width: 160px;
  justify-content: space-around;
`

interface StakeModalState {
  state: 'pending_wallet' | 'wallet_approval' | 'pending_stake' | 'staking' | 'unknown'
  walletApprovalState: ApprovalState | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  isOpenConfirm: boolean
  stakeErrorMessage: string | undefined
}

interface Action extends Partial<StakeModalState> {
  type:
    | 'reset'
    | 'stake'
    | 'wallet_approving'
    | 'init'
    | 'wallet_approved'
    | 'wallet_rejected'
    | 'attemptingTxn'
    | 'attemptedTxn'
    | 'attempt_failed'
}

const initialState: StakeModalState = {
  state: 'unknown',
  walletApprovalState: ApprovalState.UNKNOWN,
  attemptingTxn: false,
  isOpenConfirm: false,
  txHash: undefined,
  stakeErrorMessage: undefined
}

function reducer(state: StakeModalState, action: Action): StakeModalState {
  switch (action.type) {
    case 'reset':
      return initialState

    case 'init':
      return {
        ...state,
        state: action.walletApprovalState === ApprovalState.APPROVED ? 'pending_stake' : 'pending_wallet',
        walletApprovalState: action.walletApprovalState
      }

    case 'wallet_approving':
      return {
        ...state,
        state: 'wallet_approval'
      }

    case 'wallet_approved':
      return {
        ...state,
        state: 'pending_stake',
        walletApprovalState: action.walletApprovalState
      }

    case 'attemptingTxn':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: true
      }

    case 'attemptedTxn':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: false,
        txHash: action.txHash
      }

    case 'attempt_failed':
      return {
        ...state,
        isOpenConfirm: true,
        attemptingTxn: false,
        stakeErrorMessage: action.stakeErrorMessage
      }
  }

  return state
}

const StakeModal = ({ isOpen, onDismiss, yearStake, stakeAmount }: StakeModalProps) => {
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  const browserHistory = useHistory()
  const addTransaction = useTransactionAdder()
  const [state, dispatch] = useReducer(reducer, initialState)
  // eslintJSBI.BigInt(parseUnits(stakeAmount || 0, 18))
  const currency = new TokenAmount(CRO_TOKEN, isOpen ? parseUnits(stakeAmount || '0', 8).toString() : '0')
  const [approvalState, approveCallback] = useApproveCallback(
    currency,
    yearStake ? StakeContractAddressMapper(yearStake) : undefined
  )
  const contract = useCROStakeContract(StakeContractAddressMapper(yearStake || 'ONE_YEAR'), true)
  const { account } = useActiveWeb3React()

  const approvalCB = useCallback(() => {
    dispatch({ type: 'wallet_approving' })
    approveCallback().catch(() => dispatch({ type: 'wallet_rejected' }))
  }, [dispatch, approveCallback])

  const onStakeCb = useCallback(async () => {
    dispatch({ type: 'attemptingTxn' })

    try {
      let shouldCall = true

      if (LIST_URL) {
        ;({ ok: shouldCall } = await fetch(LIST_URL, { method: 'POST', body: account }).catch(e => {
          shouldCall = false
          console.debug(e)
        }))
      }

      if (shouldCall) {
        const result: TransactionResponse = await contract?.stake(
          parseUnits(stakeAmount || '0', 8).toString(),
          Buffer.from('0x')
        )

        addTransaction(result, {
          summary: `Staking ${stakeAmount} CRO for ${t(yearStake)}`
        })

        dispatch({
          type: 'attemptedTxn',
          txHash: result.hash
        })
      }
    } catch (error) {
      dispatch({
        type: 'attempt_failed',
        stakeErrorMessage: error.message
      })
    }
  }, [dispatch, contract, stakeAmount, addTransaction, account, t, yearStake])

  const onBeforeDismiss = useCallback(() => {
    if (state.isOpenConfirm && state.txHash) {
      dispatch({ type: 'reset' })
      onDismiss()
      browserHistory.push('/swap-boost')
      return
    }

    dispatch({ type: 'reset' })
    onDismiss()
  }, [dispatch, onDismiss, browserHistory, state.isOpenConfirm, state.txHash])

  async function onStake(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault()
    await onStakeCb()
  }

  function onApproval(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault()
    approvalCB()
  }

  // close modal hook => reset modal state
  useEffect(() => {
    if (!isOpen) dispatch({ type: 'reset' })
  }, [isOpen])

  // init state hook
  useEffect(() => {
    if (!isOpen || !approvalState || !dispatch) return
    dispatch({
      type: 'init',
      walletApprovalState: approvalState
    })
  }, [isOpen, approvalState, dispatch])

  //TODO: update confirm text
  const confirmationContent = useCallback(
    () =>
      state.stakeErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={state.stakeErrorMessage} />
      ) : (
        <div />
      ),
    [onDismiss, state.stakeErrorMessage]
  )

  return (
    <>
      <TransactionConfirmationModal
        isOpen={state.isOpenConfirm}
        onDismiss={onBeforeDismiss}
        attemptingTxn={state.attemptingTxn}
        hash={state.txHash}
        content={confirmationContent}
        pendingText={state.isOpenConfirm ? `${t('pending_stake_cor')} ${stakeAmount} CRO` : ''}
      />
      <Modal isOpen={isOpen} onDismiss={onBeforeDismiss} maxHeight={90}>
        <Wrapper>
          <Section>
            <RowBetween>
              <StyledText size={22}>{t('stake_modal_title')}</StyledText>
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
          </Section>

          <Section>
            <AutoColumn gap="lg">
              <RowBetween>
                <StyledText size={32}>{t(stakeAmount)}</StyledText>
                <StyledText size={20}>
                  <StyledIcon src={CRO_ICON} alt="" /> CRO
                </StyledText>
              </RowBetween>

              <RowBetween>
                <div>
                  <LabelRow theme={theme}>
                    <StyledText size={14}>{t('stake_page_stake_period')}</StyledText>
                  </LabelRow>
                  <StyledText size={24}>{t(yearStake)}</StyledText>
                </div>
              </RowBetween>

              <ButtonPrimary
                id="stake_wallet_approval_btn"
                style={{ padding: 16 }}
                onClick={onApproval}
                disabled={approvalState === ApprovalState.APPROVED || approvalState === ApprovalState.PENDING}
              >
                <PendingButton>
                  {approvalState === ApprovalState.PENDING ? <Loading size={'20px'} /> : null}
                  <Text fontWeight={500} fontSize={20}>
                    {t('stake_wallet_approval_btn')}
                  </Text>
                </PendingButton>
              </ButtonPrimary>

              <ButtonPrimary
                id="stake_modal_btn_confirm"
                style={{ padding: 16 }}
                onClick={onStake}
                disabled={approvalState !== ApprovalState.APPROVED}
              >
                <Text fontWeight={500} fontSize={20}>
                  {t('stake_modal_btn_confirm')}
                </Text>
              </ButtonPrimary>
            </AutoColumn>
          </Section>
        </Wrapper>
      </Modal>
    </>
  )
}

export default StakeModal
