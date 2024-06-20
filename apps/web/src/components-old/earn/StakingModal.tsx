import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import Loader from 'components-old/Loader'
import { t } from 'i18n'
import { StakingInfo, useDerivedStakeInfo } from 'pages/Farm/data/stakeHooks'
import { CustomStakingInfo } from 'pages/Farm/data/useCustomStakingInfo'
import { useDoTransaction } from 'pages/Stake/hooks/useDoTransaction'
import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { usePairContract, useStakingContract } from '../../hooks/useContract'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { ButtonConfirmed, ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import CurrencyInputPanel from '../CurrencyInputPanel'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import ProgressCircles from '../ProgressSteps'
import { AutoRow, RowBetween } from '../Row'

const HypotheticalRewardRate = styled.div<{ dim: boolean }>`
  display: flex;
  justify-content: space-between;
  padding-right: 20px;
  padding-left: 20px;

  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo | CustomStakingInfo
  userLiquidityUnstaked: CurrencyAmount<Token> | undefined
  dummyPair?: Pair | null
}

export default function StakingModal({
  isOpen,
  onDismiss,
  stakingInfo,
  userLiquidityUnstaked,
  dummyPair,
}: StakingModalProps) {
  // track and parse user input
  const [typedValue, setTypedValue] = useState('')
  const { parsedAmount, error } = useDerivedStakeInfo(typedValue, stakingInfo.stakingToken, userLiquidityUnstaked)
  const parsedAmountWrapped = parsedAmount

  let hypotheticalRewardRates: CurrencyAmount<Token>[] | undefined = stakingInfo?.totalRewardRates?.map((rewardRate) =>
    CurrencyAmount.fromRawAmount(rewardRate.currency, '0')
  )
  if (parsedAmountWrapped?.greaterThan('0') && stakingInfo?.totalStakedAmount) {
    hypotheticalRewardRates = stakingInfo.getHypotheticalRewardRate(
      stakingInfo.stakedAmount ? parsedAmountWrapped.add(stakingInfo.stakedAmount) : parsedAmountWrapped,
      stakingInfo.totalStakedAmount.add(parsedAmountWrapped),
      stakingInfo.totalRewardRates
    )
  }

  // state for pending and submitted txn views
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  const pairContract = usePairContract(dummyPair ? dummyPair.liquidityToken.address : undefined)

  // approval data for stake
  const deadline = useTransactionDeadline()
  const [approval, approveCallback] = useApproveCallback(parsedAmount, stakingInfo.stakingRewardAddress)

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)
  const doTransaction = useDoTransaction()

  async function onStake() {
    setAttempting(true)
    if (stakingContract && parsedAmount && deadline) {
      if (approval === ApprovalState.APPROVED) {
        const response = await doTransaction(stakingContract, 'stake', {
          args: [`0x${parsedAmount.quotient.toString(16)}`],
          summary: `${t('Stake deposited liquidity')}`,
        })
        setHash(response.hash)
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval or a signature. Please contact support.')
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  const maxAmountInput = maxAmountSpend(userLiquidityUnstaked)
  const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  async function onAttemptToApprove() {
    if ((dummyPair && !pairContract) || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmount
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    approveCallback()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>Deposit</ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <CurrencyInputPanel
            value={typedValue}
            onUserInput={onUserInput}
            onMax={handleMax}
            showMaxButton={!atMaxAmount}
            currency={stakingInfo.totalStakedAmount?.currency}
            pair={dummyPair}
            label=""
            disableCurrencySelect={true}
            customBalanceText={`${t('Available to deposit')}: `}
            id="stake-liquidity-token"
          />

          <HypotheticalRewardRate dim={false}>
            <div>
              <ThemedText.DeprecatedBlack fontWeight={600}>Weekly Rewards</ThemedText.DeprecatedBlack>
            </div>

            <div>
              {hypotheticalRewardRates &&
                hypotheticalRewardRates.map((hypotheticalRewardRate, idx) => {
                  return (
                    <ThemedText.DeprecatedBlack key={idx}>
                      {hypotheticalRewardRate
                        .multiply((60 * 60 * 24 * 7).toString())
                        .toSignificant(4, { groupSeparator: ',' }) +
                        ` ${hypotheticalRewardRate.currency.symbol} / week`}
                    </ThemedText.DeprecatedBlack>
                  )
                })}
            </div>
          </HypotheticalRewardRate>

          <RowBetween>
            <ButtonConfirmed
              mr="0.5rem"
              onClick={onAttemptToApprove}
              confirmed={approval === ApprovalState.APPROVED}
              disabled={approval !== ApprovalState.NOT_APPROVED}
            >
              {approval === ApprovalState.PENDING ? (
                <AutoRow gap="6px" justify="center">
                  Approving <Loader stroke="white" />
                </AutoRow>
              ) : (
                `${t('Approve')}`
              )}
            </ButtonConfirmed>
            <ButtonError
              disabled={!!error || approval !== ApprovalState.APPROVED}
              error={!!error && !!parsedAmount}
              onClick={onStake}
            >
              {error ?? `${t('Deposit')}`}
            </ButtonError>
          </RowBetween>
          <ProgressCircles steps={[approval === ApprovalState.APPROVED]} disabled={true} />
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>{t('Depositing liquidity')}</ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              {parsedAmount?.toSignificant(4)}{' '}
              {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE LP' : stakingInfo.stakingToken?.symbol}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>{t('Transaction Submitted')}</ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              Deposited {parsedAmount?.toSignificant(4)}{' '}
              {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE LP' : stakingInfo.stakingToken?.symbol}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
