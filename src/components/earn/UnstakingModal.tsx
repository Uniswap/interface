import { useContractKit } from '@celo-tools/use-contractkit'
import { useDoTransaction } from 'components/swap/routing'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useStakingContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks'
import { CloseIcon, TYPE } from '../../theme'
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
  stakingInfo: StakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { address: account } = useContractKit()

  // monitor call to help UI loading state
  const doTransaction = useDoTransaction()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const { t } = useTranslation()

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
        summary: `${t('WithdrawDepositedLiquidity')}`,
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
    error = `${t('ConnectWallet')}`
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? `${t('EnterAnAmount')}`
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>{t('withdraw')}</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {stakingInfo?.stakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.body fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={stakingInfo.stakedAmount} />}
              </TYPE.body>
              <TYPE.body>{t('DepositedLiquidity')}</TYPE.body>
            </AutoColumn>
          )}
          <AutoColumn justify="center" gap="md">
            {stakingInfo?.earnedAmounts?.map((earnedAmount, idx) => {
              return (
                <React.Fragment key={idx}>
                  <TYPE.body fontWeight={600} fontSize={36}>
                    {<FormattedCurrencyAmount currencyAmount={earnedAmount} />}
                  </TYPE.body>
                  <TYPE.body>
                    {t('Unclaimed')} {earnedAmount.token.symbol}
                  </TYPE.body>
                </React.Fragment>
              )
            })}
          </AutoColumn>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            {t('WhenYouWithdrawYourUbeIsClaimedAndYourLiquidityIsRemovedFromTheMiningPool')}
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onWithdraw}>
            {error ?? `${t('Withdraw&Claim')}`}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.body fontSize={20}>Withdrawing {stakingInfo?.stakedAmount?.toSignificant(4)} UBE-LP</TYPE.body>
            <TYPE.body fontSize={20}>
              Claiming{' '}
              {stakingInfo?.earnedAmounts
                ?.map((earnedAmount) => `${earnedAmount.toSignificant(4)} ${earnedAmount.token.symbol}`)
                .join(' + ')}
            </TYPE.body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}>Withdrew UBE-LP!</TYPE.body>
            <TYPE.body fontSize={20}>
              Claimed {stakingInfo?.rewardTokens.map((rewardToken) => rewardToken.symbol).join(' + ')}!
            </TYPE.body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
