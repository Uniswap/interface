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
import useMasterChef from 'hooks/farm/useMasterChef'
import { Chef } from 'constants/farm/chef.enum'
import { utils } from 'ethers'
import { Token, TokenAmount } from '@teleswap/sdk'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { useChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import { useChefContractForCurrentChain } from 'hooks/farm/useChefContract'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useTranslation } from 'react-i18next'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { useTokenBalance } from 'state/wallet/hooks'
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
  const { chainId, account } = useActiveWeb3React()
  const { t } = useTranslation()
  // track and parse user input
  const [typedValue, setTypedValue] = useState('0')
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
  const thisPool = stakingInfos[pid]
  const stakingCurrency = thisPool.stakingToken

  const tokenAmount = new TokenAmount(
    stakingCurrency,
    utils.parseUnits(typedValue, stakingCurrency.decimals).toString()
  )
  const stakeTokenBalance = useTokenBalance(account, stakingCurrency)
  const stakingContract = useChefContractForCurrentChain()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const [approval, approve] = useApproveCallback(tokenAmount, stakingContract?.address)
  const mchef = useMasterChef(farmingConfig?.chefType || Chef.MINICHEF)
  console.debug('approval', approval)
  // const [parsedAmount, setParsedAmount] = useState('0')
  // const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)
  async function onStake() {
    setAttempting(true)
    if (stakingContract && deadline) {
      if (approval === ApprovalState.APPROVED) {
        mchef
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
    if (!typedValue) return
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  const maxAmountInput = maxAmountSpend(stakeTokenBalance)
  // const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    if (maxAmountInput) onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  // async function onAttemptToApprove() {
  //   // @todo: approve stake token to masterchef
  //   approve()
  // }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader color="#FFFFFF">{t('stakeLpToken')}</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} color="#FFFFFF" />
          </RowBetween>
          <CurrencyInputPanel
            value={typedValue}
            onUserInput={onUserInput}
            onMax={handleMax}
            showMaxButton={true}
            currency={stakingCurrency}
            // pair={dummyPair}
            label={''}
            disableCurrencySelect={true}
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
              {t('approve')}
            </ButtonConfirmed>
            <ButtonError
              disabled={signatureData === null && approval !== ApprovalState.APPROVED}
              // error={!!&& !!parsedAmount}
              onClick={onStake}
            >
              {t('stakeLpToken')}
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
