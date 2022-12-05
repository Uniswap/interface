import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import StakingRewardsJson from '@uniswap/liquidity-staker/build/StakingRewards.json'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'

import { useContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { CloseIcon, ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const { abi: STAKING_REWARDS_ABI } = StakingRewardsJson

function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean) {
  return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible)
}

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onWithdraw() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await stakingContract
        .exit({ gasLimit: 300000 })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.WITHDRAW_LIQUIDITY_STAKING,
            token0Address: stakingInfo.tokens[0].address,
            token1Address: stakingInfo.tokens[1].address,
          })
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect a wallet</Trans>
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? <Trans>Enter an amount</Trans>
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>
              <Trans>Withdraw</Trans>
            </ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.HeadlineLarge>
                <FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />
              </ThemedText.HeadlineLarge>
              <ThemedText.DeprecatedBody>
                <Trans>Deposited liquidity:</Trans>
              </ThemedText.DeprecatedBody>
            </AutoColumn>
          )}
          {stakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.HeadlineLarge>
                <FormattedCurrencyAmount currencyAmount={stakingInfo?.earnedAmount} />
              </ThemedText.HeadlineLarge>
              <ThemedText.DeprecatedBody>
                <Trans>Unclaimed UNI</Trans>
              </ThemedText.DeprecatedBody>
            </AutoColumn>
          )}
          <ThemedText.DeprecatedSubHeader style={{ textAlign: 'center' }}>
            <Trans>When you withdraw, your UNI is claimed and your liquidity is removed from the mining pool.</Trans>
          </ThemedText.DeprecatedSubHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? <Trans>Withdraw & Claim</Trans>}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Withdrawing {stakingInfo?.stakedAmount?.toSignificant(4)} UNI-V2</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Claiming {stakingInfo?.earnedAmount?.toSignificant(4)} UNI</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Withdrew UNI-V2!</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Claimed UNI!</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
