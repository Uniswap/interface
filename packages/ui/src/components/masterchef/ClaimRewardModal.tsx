import React, { useMemo, useState } from 'react'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonError } from '../Button'
// import { useStakingContract } from '../../hooks/useContract'
import { SubmittedView, LoadingView } from '../ModalViews'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import FormattedCurrencyAmount from '../FormattedCurrencyAmount'
import { useActiveWeb3React } from '../../hooks'
import useMasterChef from 'hooks/farm/useMasterChef'
import { Chef } from 'constants/farm/chef.enum'
import { BigNumber } from 'ethers'
import { useChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { CurrencyAmount } from '@teleswap/sdk'
import { UNI } from 'constants/index'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useChefContract } from 'hooks/farm/useChefContract'
import { useTranslation } from 'react-i18next'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  color: white;
`

interface ClaimRewardModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
}

export default function ClaimRewardModal({ isOpen, onDismiss, pid }: ClaimRewardModalProps) {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const mchefContract = useChefContract(farmingConfig?.chefType || Chef.MINICHEF)
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const masterChef = useMasterChef(Chef.MINICHEF)

  // track and parse user input
  const stakingInfos = useChefStakingInfo()
  const thisPool = stakingInfos[pid]
  const stakingCurrency = thisPool.stakingToken

  const rewardToken = UNI[chainId || 420]
  const positions = useChefPositions(mchefContract, undefined, chainId)

  const parsedPendingSushiAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].pendingSushi) {
        const bi = (positions[pid].pendingSushi as BigNumber).toBigInt()
        console.debug('parsedPendingSushiAmount::bi', bi)
        return CurrencyAmount.fromRawAmount(rewardToken, bi)
      }
    } catch (error) {
      console.error('parsedPendingSushiAmount::error', error)
    }
    return undefined
  }, [rewardToken, positions, pid])
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
          summary: `Claim Reward of Staking ${farmingConfig?.pools[pid].stakingAsset.name}`,
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
          {parsedPendingSushiAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.white fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={parsedPendingSushiAmount} />}
              </TYPE.white>
              <TYPE.white>
                {t('unclaimed')} {rewardToken.symbol}
              </TYPE.white>
            </AutoColumn>
          )}
          {/* <TYPE.subHeader style={{ textAlign: 'center' }}>
            Unused sub header, we will block this. Enable this when we need to do so.
          </TYPE.subHeader> */}
          <ButtonError disabled={!!error} error={!!error && !!positions[pid].amount} onClick={onHarvestButtonClicked}>
            {error ?? t('claim')}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.white fontSize={20}>
              {t('claiming')} {parsedPendingSushiAmount?.toSignificant(4)} {rewardToken.symbol}
            </TYPE.white>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.white fontSize={20}>Withdrew {stakingCurrency.symbol}!</TYPE.white>
            <TYPE.white fontSize={20}>
              {t('claimed')} {rewardToken.symbol}!
            </TYPE.white>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
