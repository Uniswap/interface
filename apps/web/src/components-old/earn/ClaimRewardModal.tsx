import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { t } from 'i18n'
import zip from 'lodash/zip'
import { StakingInfo } from 'pages/Farm/data/stakeHooks'
import { CustomStakingInfo } from 'pages/Farm/data/useCustomStakingInfo'
import { useDoTransaction } from 'pages/Stake/hooks/useDoTransaction'
import { useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { useStakingContract } from '../../hooks/useContract'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
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

export default function ClaimRewardModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useWeb3React()

  // monitor call to help UI loading state
  const doTransaction = useDoTransaction()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onClaimReward() {
    if (stakingContract && stakingInfo?.stakedAmount) {
      setAttempting(true)
      await doTransaction(stakingContract, 'getReward', {
        args: [],
        summary: `${t('Claim accumulated UBE rewards')}`,
      })
        .catch(console.error)
        .finally(() => {
          wrappedOnDismiss()
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
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>Claim</ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <AutoColumn justify="center" gap="md">
            {stakingInfo.earnedAmounts &&
              stakingInfo.rewardRates &&
              zip<CurrencyAmount<Token>, CurrencyAmount<Token>>(
                stakingInfo?.earnedAmounts,
                stakingInfo?.rewardRates
              ).map(([earn, reward], idx) => {
                return (
                  <ThemedText.DeprecatedBody fontWeight={600} fontSize={36} key={idx}>
                    {earn?.toSignificant(4)} {reward?.currency.symbol}
                  </ThemedText.DeprecatedBody>
                )
              })}
            <ThemedText.DeprecatedBody>Unclaimed rewards</ThemedText.DeprecatedBody>
          </AutoColumn>
          <ThemedText.DeprecatedSubHeader style={{ textAlign: 'center' }}>
            {t('When you claim without withdrawing your liquidity remains in the mining pool.')}
          </ThemedText.DeprecatedSubHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onClaimReward}>
            {error ?? `${t('Claim')}`}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedBody fontSize={20}>
              {t('Claiming')}{' '}
              {stakingInfo?.earnedAmounts
                ?.map((earnedAmount) => `${earnedAmount.toSignificant(4)} ${earnedAmount?.currency.symbol}`)
                .join(' + ')}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>{t('Transaction Submitted')}</ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              {t('Claimed')} {stakingInfo?.rewardTokens.map((rewardToken) => rewardToken.symbol).join(' + ')}!
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
