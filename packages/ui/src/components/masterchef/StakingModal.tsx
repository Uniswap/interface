import { TransactionResponse } from '@ethersproject/providers'
import { TokenAmount } from '@teleswap/sdk'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { utils } from 'ethers'
import { useChefContractForCurrentChain } from 'hooks/farm/useChefContract'
import { ChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import useMasterChef from 'hooks/farm/useMasterChef'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenBalance } from 'state/wallet/hooks'
import styled from 'styled-components'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { useActiveWeb3React } from '../../hooks'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonConfirmed, ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import CurrencyInputPanel from '../CurrencyInputPanel'
import Modal from '../Modal'
import ProgressCircles from '../ProgressSteps'
import { RowBetween } from '../Row'
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
  stakingInfo: ChefStakingInfo
  // userLiquidityUnstaked: TokenAmount | undefined
}

export default function StakingModal({ isOpen, onDismiss, pid, stakingInfo }: StakingModalProps) {
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
  const stakingCurrency = stakingInfo?.stakingToken

  const tokenAmount = stakingCurrency
    ? new TokenAmount(stakingCurrency, utils.parseUnits(typedValue, stakingCurrency.decimals).toString())
    : undefined
  const stakeTokenBalance = useTokenBalance(account === null ? undefined : account, stakingCurrency)
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
          .deposit(pid, utils.parseUnits(typedValue, stakingCurrency?.decimals))
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Deposit liquidity`
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

  if (!stakingCurrency) return <p>Loading...</p>

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

          <RowBetween>
            {approval !== ApprovalState.APPROVED && (
              <ButtonConfirmed
                mr="0.5rem"
                onClick={approve}
                confirmed={signatureData !== null}
                disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
              >
                {t('approve')}
              </ButtonConfirmed>
            )}
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
              {tokenAmount?.toSignificant(4)} {stakingCurrency?.symbol}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>
              Deposited {tokenAmount?.toSignificant(4)} {stakingCurrency?.symbol}
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
