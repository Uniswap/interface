import { TransactionResponse } from '@ethersproject/providers'
import { JSBI, TokenAmount } from '@teleswap/sdk'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { UNI } from 'constants/index'
import { BigNumber, utils } from 'ethers'
import { useChefContractForCurrentChain } from 'hooks/farm/useChefContract'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { ChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
import useMasterChef from 'hooks/farm/useMasterChef'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { useActiveWeb3React } from '../../hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import { FarmingWithdrawInputPanel } from '../CurrencyInputPanel'
import Modal from '../Modal'
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

interface UnstakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  pid: number
  stakingInfo: ChefStakingInfo
  // userLiquidityUnstaked: TokenAmount | undefined
}

export default function UnstakingModal({ isOpen, onDismiss, pid, stakingInfo }: UnstakingModalProps) {
  const { chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const stakingContract = useChefContractForCurrentChain()
  const positions = useChefPositions(stakingContract, undefined, chainId)
  const rewardToken = UNI[chainId || 420]
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

  const stakingCurrency = stakingInfo?.stakingToken

  /** changes needed since it's withdraw  */
  const userInputWithdrawAmount = stakingCurrency
    ? new TokenAmount(stakingCurrency, utils.parseUnits(typedValue, stakingCurrency.decimals).toString())
    : undefined
  const userStakedAmount = stakingCurrency
    ? new TokenAmount(stakingCurrency, positions[pid].amount.toString())
    : undefined
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const masterChef = useMasterChef(farmingConfig?.chefType || Chef.MINICHEF)
  // const [parsedAmount, setParsedAmount] = useState('0')
  // const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)
  async function onWithdraw() {
    /**
     * do some checks
     */
    if (userInputWithdrawAmount?.greaterThan(userStakedAmount || JSBI.BigInt(0))) {
      alert('You do not have enough staked token')
      return
    }
    setAttempting(true)
    masterChef
      .withdraw(pid, BigNumber.from(userInputWithdrawAmount?.raw.toString()))
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

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    // setSignatureData(null)
    if (!typedValue) return
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  const maxAmountInput = maxAmountSpend(userStakedAmount)
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
            <TYPE.mediumHeader color="#FFFFFF">{t('unstakeLpToken')}</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} color="#FFFFFF" />
          </RowBetween>
          <FarmingWithdrawInputPanel
            value={typedValue}
            onUserInput={onUserInput}
            onMax={handleMax}
            showMaxButton={true}
            currency={stakingCurrency}
            selectedCurrencyBalance={userStakedAmount}
            // pair={dummyPair}
            label={''}
            disableCurrencySelect={true}
            id="stake-liquidity-token"
          />

          <TYPE.subHeader style={{ textAlign: 'center' }}>
            * Reward will be claimed automatically once you unstake any amount of LP tokens.
          </TYPE.subHeader>
          <RowBetween>
            <ButtonError
              // error={!!&& !!parsedAmount}
              onClick={onWithdraw}
            >
              {t('unstakeLpToken')}
            </ButtonError>
          </RowBetween>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.white fontSize={20}>
              Withdrawing {userInputWithdrawAmount?.toSignificant(4)} {stakingCurrency?.symbol}
            </TYPE.white>
            <TYPE.white fontSize={20}>
              Claiming {stakingInfo?.pendingReward?.toSignificant(4)} {rewardToken.symbol}
            </TYPE.white>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
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
