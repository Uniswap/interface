import { TransactionResponse } from '@ethersproject/providers'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { UNI } from 'constants/index'
import { useChefContract } from 'hooks/farm/useChefContract'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { ChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import useMasterChef from 'hooks/farm/useMasterChef'
import React, { useState } from 'react'
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

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
  stakingInfo: ChefStakingInfo
}

export default function UnstakingModal({ isOpen, onDismiss, pid, stakingInfo }: StakingModalProps) {
  const { account, chainId } = useActiveWeb3React()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const mchefContract = useChefContract(farmingConfig?.chefType || Chef.MINICHEF)
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const masterChef = useMasterChef(Chef.MINICHEF)

  // track and parse user input
  const stakingCurrency = stakingInfo?.stakingToken

  const rewardToken = UNI[chainId || 420]
  const positions = useChefPositions(mchefContract, undefined, chainId)

  const parsedStakedAmount = stakingInfo?.stakedAmount

  const parsedPendingSushiAmount = stakingInfo?.pendingReward
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onWithdraw() {
    setAttempting(true)
    masterChef
      .withdraw(pid, positions[pid].amount)
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Withdraw staked token in Farming`
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
            <TYPE.mediumHeader color="#FFFFFF">Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} color="#FFFFFF" />
          </RowBetween>
          {parsedStakedAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.white fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={parsedStakedAmount} />}
              </TYPE.white>
              <TYPE.white>Deposited liquidity:</TYPE.white>
            </AutoColumn>
          )}
          {parsedPendingSushiAmount && (
            <AutoColumn justify="center" gap="md">
              <TYPE.white fontWeight={600} fontSize={36}>
                {<FormattedCurrencyAmount currencyAmount={parsedPendingSushiAmount} />}
              </TYPE.white>
              <TYPE.white>Unclaimed {rewardToken.symbol}</TYPE.white>
            </AutoColumn>
          )}
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            When you withdraw, your UNI is claimed and your liquidity is removed from the mining pool.
          </TYPE.subHeader>
          <ButtonError disabled={!!error} error={!!error && !!positions[pid].amount} onClick={onWithdraw}>
            {error ?? 'Withdraw & Claim'}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.white fontSize={20}>
              Withdrawing {parsedStakedAmount?.toSignificant(4)} {stakingCurrency?.symbol}
            </TYPE.white>
            <TYPE.white fontSize={20}>
              Claiming {parsedPendingSushiAmount?.toSignificant(4)} {rewardToken.symbol}
            </TYPE.white>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.white fontSize={20}>Withdrew {stakingCurrency?.symbol}!</TYPE.white>
            <TYPE.white fontSize={20}>Claimed {rewardToken.symbol}!</TYPE.white>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
