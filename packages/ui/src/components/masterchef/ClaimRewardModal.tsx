import { TransactionResponse } from '@ethersproject/providers'
import { Chef } from 'constants/farm/chef.enum'
import { ChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import useMasterChef from 'hooks/farm/useMasterChef'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useActiveWeb3React } from '../../hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import Modal from '../Modal'
// import { useStakingContract } from '../../hooks/useContract'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  color: white;
`

interface ClaimRewardModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
  stakingInfo: ChefStakingInfo
}

export default function ClaimRewardModal({ isOpen, onDismiss, pid, stakingInfo: thisPool }: ClaimRewardModalProps) {
  const { account } = useActiveWeb3React()
  const { t } = useTranslation()
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const masterChef = useMasterChef(Chef.MINICHEF)

  // track and parse user input
  const stakingCurrency = thisPool?.stakingToken
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onHarvestButtonClicked() {
    setAttempting(true)
    masterChef
      .harvest(pid)
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Claim Reward of Staking ${stakingCurrency.name}`
        })
        setHash(response.hash)
      })
      .catch((error: any) => {
        setAttempting(false)
        console.log(error)
      })
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader color="#FFFFFF">{t('claimRewards')}</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} color="#FFFFFF" />
          </RowBetween>
          {thisPool.pendingReward && (
            <AutoColumn justify="center" gap="md">
              <TYPE.white fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={thisPool.pendingReward} />}
              </TYPE.white>
              <TYPE.white>
                {t('unclaimed')} {thisPool.rewardToken.symbol}
              </TYPE.white>
            </AutoColumn>
          )}
          {/* <TYPE.subHeader style={{ textAlign: 'center' }}>
            Unused sub header, we will block this. Enable this when we need to do so.
          </TYPE.subHeader> */}
          <ButtonError disabled={!!error} error={!!error && !!thisPool.stakedAmount} onClick={onHarvestButtonClicked}>
            {error ?? t('claim')}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.white fontSize={20}>
              {t('claiming')} {thisPool?.pendingReward.toSignificant(4)} {thisPool?.rewardToken.symbol}
            </TYPE.white>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.white fontSize={20}>Withdrew {stakingCurrency?.symbol}!</TYPE.white>
            <TYPE.white fontSize={20}>
              {t('claimed')} {thisPool.rewardToken.symbol}!
            </TYPE.white>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
