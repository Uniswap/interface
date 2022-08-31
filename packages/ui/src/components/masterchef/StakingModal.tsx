import React, { useState, useCallback } from 'react'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonConfirmed, ButtonError } from '../Button'
import ProgressCircles from '../ProgressSteps'
import CurrencyInputPanel from '../CurrencyInputPanel'
import { useActiveWeb3React } from '../../hooks'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { MASTERCHEF_ADDRESSBOOK } from 'constants/index'
import useMasterChef from 'hooks/farm/useMasterChef'
import { Chef } from 'constants/farm/chef.enum'
import { utils } from 'ethers'
import { Token, TokenAmount } from '@teleswap/sdk'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { useChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
// const HypotheticalRewardRate = styled.div<{ dim: boolean }>`
//   display: flex;
//   justify-content: space-between;
//   padding-right: 20px;
//   padding-left: 20px;

//   opacity: ${({ dim }) => (dim ? 0.5 : 1)};
// `

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
  // userLiquidityUnstaked: TokenAmount | undefined
}

export default function StakingModal({ isOpen, onDismiss, pid }: StakingModalProps) {
  const { chainId } = useActiveWeb3React()

  // track and parse user input
  const [typedValue, setTypedValue] = useState('')
  // const parsedAmountWrapped = wrappedCurrencyAmount(parsedAmount, chainId)

  // state for pending and submitted txn views
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  // approval data for stake
  const deadline = useTransactionDeadline()
  // disabled
  // const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const signatureData = null
  const stakingInfos = useChefStakingInfo()
  // @todo: we need the token profile of this pool
  // @todo: we need the symbol of staking token
  const thisPool = stakingInfos[pid]
  const stakingCurrency = thisPool.stakingToken

  const tokenAmount = new TokenAmount(stakingCurrency, typedValue)
  console.info('tokenAmount', tokenAmount)
  const [approval, approve] = useApproveCallback(tokenAmount, MASTERCHEF_ADDRESSBOOK[chainId ?? 420])
  // const [parsedAmount, setParsedAmount] = useState('0')
  // const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)
  const stakingContract = useMasterChef(Chef.MINICHEF)
  async function onStake() {
    setAttempting(true)
    if (stakingContract && deadline) {
      if (approval === ApprovalState.APPROVED) {
        stakingContract
          .deposit(pid, utils.parseUnits(typedValue, stakingCurrency.decimals))
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Deposit liquidity`,
            })
            setHash(response.hash)
          })
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval or a signature. Please contact support.')
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    // setSignatureData(null)
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  // const maxAmountInput = maxAmountSpend(userLiquidityUnstaked)
  // const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  // const handleMax = useCallback(() => {
  //   maxAmountInput && onUserInput(maxAmountInput.toExact())
  // }, [maxAmountInput, onUserInput])

  // async function onAttemptToApprove() {
  //   // @todo: approve stake token to masterchef
  //   approve()
  // }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Deposit</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <CurrencyInputPanel
            value={typedValue}
            onUserInput={onUserInput}
            onMax={() => console.warn('max disabled')}
            showMaxButton={false}
            currency={stakingCurrency}
            // pair={dummyPair}
            label={''}
            disableCurrencySelect={true}
            customBalanceText={'Available to deposit: '}
            id="stake-liquidity-token"
          />

          {/* <HypotheticalRewardRate dim={!hypotheticalRewardRate.greaterThan('0')}>
            <div>
              <TYPE.black fontWeight={600}>Weekly Rewards</TYPE.black>
            </div>

            <TYPE.black>
              {hypotheticalRewardRate.multiply((60 * 60 * 24 * 7).toString()).toSignificant(4, { groupSeparator: ',' })}{' '}
              UNI / week
            </TYPE.black>
          </HypotheticalRewardRate> */}

          <RowBetween>
            <ButtonConfirmed
              mr="0.5rem"
              onClick={approve}
              confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
              disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
            >
              Approve
            </ButtonConfirmed>
            <ButtonError
              disabled={signatureData === null && approval !== ApprovalState.APPROVED}
              // error={!!&& !!parsedAmount}
              onClick={onStake}
            >
              Deposit
            </ButtonError>
          </RowBetween>
          <ProgressCircles steps={[approval === ApprovalState.APPROVED || signatureData !== null]} disabled={true} />
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Depositing</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              {tokenAmount?.toSignificant(4)} {stakingCurrency.symbol}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              Deposited {tokenAmount?.toSignificant(4)} {stakingCurrency.symbol}
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
