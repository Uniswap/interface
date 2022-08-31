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
import { BigNumber, utils } from 'ethers'
import { useChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { CurrencyAmount, Token } from '@teleswap/sdk'
import { UNI, ZERO_ADDRESS } from 'constants/index'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useChefContract } from 'hooks/farm/useChefContract'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
  color: white;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
}

export default function UnstakingModal({ isOpen, onDismiss, pid }: StakingModalProps) {
  const { account, chainId } = useActiveWeb3React()
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

  const parsedStakedAmount = useMemo(() => {
    try {
      if (positions && positions[pid] && positions[pid].amount) {
        const bi = (positions[pid].amount as BigNumber).toBigInt()
        return CurrencyAmount.fromRawAmount(new Token(chainId || 420, ZERO_ADDRESS, 18), bi)
      }
    } catch (error) {
      console.error('parsedStakedAmount::error', error)
    }
    return undefined
  }, [chainId, positions, pid])

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

  async function onWithdraw() {
    setAttempting(true)
    masterChef
      .withdraw(pid, positions[pid].amount)
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Withdraw staked token in Farming`,
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
            <TYPE.mediumHeader>Withdraw</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
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
              Withdrawing {parsedStakedAmount?.toSignificant(4)} {stakingCurrency.symbol}
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
            <TYPE.white fontSize={20}>Withdrew {stakingCurrency.symbol}!</TYPE.white>
            <TYPE.white fontSize={20}>Claimed {rewardToken.symbol}!</TYPE.white>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
