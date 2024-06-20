import { useWeb3React } from '@web3-react/core'
import { t } from 'i18n'
import { StakingInfo } from 'pages/Farm/data/stakeHooks'
import { CustomStakingInfo } from 'pages/Farm/data/useCustomStakingInfo'
import { useDoTransaction } from 'pages/Stake/hooks/useDoTransaction'
import React, { useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { useStakingContract } from '../../hooks/useContract'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo | CustomStakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useWeb3React()

  // monitor call to help UI loading state
  const doTransaction = useDoTransaction()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onWithdraw() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await doTransaction(stakingContract, 'exit', {
        args: [],
        summary: `${t('Withdraw deposited liquidity')}`,
      })
        .then((response) => {
          setHash(response.hash)
        })
        .catch(() => {
          setAttempting(false)
        })
    }
  }

  let error: string | undefined
  if (!account) {
    error = `${t('Connect wallet')}`
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? `${t('Enter an amount')}`
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>{t('Withdraw')}</ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.DeprecatedBody fontWeight={600} fontSize={36}>
                <FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />
              </ThemedText.DeprecatedBody>
              <ThemedText.DeprecatedBody>{t('Deposited liquidity')}</ThemedText.DeprecatedBody>
            </AutoColumn>
          )}
          <AutoColumn justify="center" gap="md">
            {stakingInfo?.earnedAmounts?.map((earnedAmount, idx) => {
              return (
                <React.Fragment key={idx}>
                  <ThemedText.DeprecatedBody fontWeight={600} fontSize={36}>
                    <FormattedCurrencyAmount currencyAmount={earnedAmount} />
                  </ThemedText.DeprecatedBody>
                  <ThemedText.DeprecatedBody>
                    {t('Unclaimed')} {earnedAmount.currency.symbol}
                  </ThemedText.DeprecatedBody>
                </React.Fragment>
              )
            })}
          </AutoColumn>
          <ThemedText.DeprecatedSubHeader style={{ textAlign: 'center' }}>
            {t('When you withdraw, your UBE is claimed and your liquidity is removed from the mining pool.')}
          </ThemedText.DeprecatedSubHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? `${t('Withdraw & Claim')}`}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedBody fontSize={20}>
              Withdrawing {stakingInfo?.stakedAmount?.toSignificant(4)}{' '}
              {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE-LP' : stakingInfo.stakingToken?.symbol}
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={20}>
              Claiming{' '}
              {stakingInfo?.earnedAmounts
                ?.map((earnedAmount) => `${earnedAmount.toSignificant(4)} ${earnedAmount.currency.symbol}`)
                .join(' + ')}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>Transaction Submitted</ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              Withdrew {stakingInfo.stakingToken?.symbol === 'ULP' ? 'UBE-LP' : stakingInfo.stakingToken?.symbol}!
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={20}>
              Claimed {stakingInfo?.rewardTokens.map((rewardToken) => rewardToken.symbol).join(' + ')}!
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
