import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider/Divider'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { Contract } from 'ethers/lib/ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useIsMobile } from 'nft/hooks'
import React, { useCallback, useMemo, useState } from 'react'
import { Box, Text } from 'rebass'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { useTransactionFinalizer } from 'utils/farmUtils'

import { TransactionType } from '../../../state/transactions/types'
import { GridItemGammaCard } from './GridItemGammaCard'

// Estilo do Grid
const Grid = styled.div<{ isMobile: boolean; hasRewards: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: ${(props) => (props.isMobile ? 'none' : 'repeat(3, 1fr)')};
  grid-template-rows: ${(props) =>
    props.isMobile ? (props.hasRewards ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)') : 'none'};
  gap: 16px;
`

// Estilo do Item do Grid
const GridItem = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 18px;
`

const ClaimContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
`
const GammaFarmCardDetails: React.FC<{
  pairData: any
  rewardData: any
  dataDetails: {
    stakeAmount: string
    stakedAmount: string
    lpTokenBalance?: CurrencyAmount<Token>
    lpBalanceBN: any
    approval: ApprovalState
    approveCallback: () => Promise<void>
    parsedStakeAmount?: CurrencyAmount<Token>
    availableStakeAmount: string
    stakedAmountBN: any
    masterChefContract: Contract | null
    stakedUSD: number
    availableStakeUSD: number
    setStakeAmount: React.Dispatch<React.SetStateAction<string>>
    lpSymbol: string
  }
  forceUpdate: () => void
}> = ({ pairData, rewardData, dataDetails, forceUpdate }) => {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const finalizedTransaction = useTransactionFinalizer()
  const [unStakeAmount, setUnStakeAmount] = useState('')
  const [approveOrStaking, setApproveOrStaking] = useState(false)
  const [attemptUnstaking, setAttemptUnstaking] = useState(false)
  const [attemptClaiming, setAttemptClaiming] = useState(false)
  const isMobile = useIsMobile()
  const theme = useTheme()
  const rewardTokenAddress = rewardData?.rewardTokenAddress
  const token = useToken(rewardTokenAddress?.result?.toString())

  const rewards = useSingleCallResult(dataDetails.masterChefContract, 'pendingReward', [
    pairData.pid,
    account ?? undefined,
  ])
  const rewardsBN = !rewards.loading && rewards.result && rewards.result.length > 0 ? rewards.result[0] : undefined
  const rewardsAmount = rewardsBN ? formatUnits(rewardsBN, 18) : '0'

  const rewardTokenContract = useSingleCallResult(dataDetails.masterChefContract, 'REWARD')
  const rewardToken = useToken(rewardTokenContract?.result?.toString())

  const stakeButtonDisabled =
    Number(dataDetails.stakeAmount) <= 0 ||
    !dataDetails.lpTokenBalance ||
    dataDetails.parsedStakeAmount?.greaterThan(dataDetails.lpTokenBalance) ||
    !dataDetails.masterChefContract ||
    !account ||
    approveOrStaking

  const unStakeButtonDisabled =
    Number(unStakeAmount) <= 0 ||
    Number(unStakeAmount) > Number(dataDetails.stakedAmount) ||
    !dataDetails.masterChefContract ||
    !account ||
    attemptUnstaking

  const claimButtonDisabled = Number(rewardsAmount) == 0 || attemptClaiming

  const approveOrStakeLP = async () => {
    setApproveOrStaking(true)
    try {
      if (dataDetails.approval === ApprovalState.APPROVED) {
        stateTransactionDeposit(true, true, undefined, undefined)
        await stakeLP()
      } else {
        await dataDetails.approveCallback()
        stateTransactionDeposit(false, false, undefined, undefined)
      }

      setApproveOrStaking(false)
    } catch (e) {
      stateTransactionDeposit(false, true, e.message, undefined)
      console.log('Err:', e)
      setApproveOrStaking(false)
    }
  }

  const stakeLP = async () => {
    if (!dataDetails.masterChefContract || !account || !dataDetails.lpBalanceBN) return

    const estimatedGas = await dataDetails.masterChefContract.estimateGas.deposit(
      pairData.pid,
      dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18),
      account
    )

    const response: TransactionResponse = await dataDetails.masterChefContract.deposit(
      pairData.pid,
      dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18),
      account,
      {
        gasLimit: calculateGasMargin(estimatedGas),
      }
    )

    addTransaction(response, {
      type: TransactionType.DEPOSIT_FARM,
      pid: pairData.pid,
      amount: (dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18)
      ).toString(),
      tokenAddress: pairData.hypervisor,
    })
    const receipt = await response.wait()
    finalizedTransaction(receipt, {
      summary: 'depositliquidity',
    })
    stateTransactionDeposit(false, true, undefined, receipt.transactionHash)
  }

  const unStakeLP = async () => {
    if (!dataDetails.masterChefContract || !account || !dataDetails.stakedAmountBN) return
    setAttemptUnstaking(true)
    stateTransactionWithdraw(true, true, undefined, undefined)
    try {
      const estimatedGas = await dataDetails.masterChefContract.estimateGas.withdraw(
        pairData.pid,
        unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18),
        account
      )
      const response: TransactionResponse = await dataDetails.masterChefContract.withdraw(
        pairData.pid,
        unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18),
        account,
        {
          gasLimit: calculateGasMargin(estimatedGas),
        }
      )

      addTransaction(response, {
        type: TransactionType.WITHDRAW_FARM,
        pid: pairData.pid,
        amount: (unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18)
        ).toString(),
        tokenAddress: pairData.hypervisor,
      })
      const receipt = await response.wait()
      finalizedTransaction(receipt, {
        summary: 'withdrawliquidity',
      })
      stateTransactionWithdraw(false, true, undefined, receipt.transactionHash)
      setAttemptUnstaking(false)
    } catch (e) {
      setAttemptUnstaking(false)
      stateTransactionWithdraw(false, true, e.message, undefined)
      console.log('err: ', e)
    }
  }

  const claimReward = async () => {
    if (!dataDetails.masterChefContract || !account) return
    setAttemptClaiming(true)
    stateTransaction(true, true, undefined, undefined)
    try {
      const estimatedGas = await dataDetails.masterChefContract.estimateGas.harvest(pairData.pid, account)
      const response: TransactionResponse = await dataDetails.masterChefContract.harvest(pairData.pid, account, {
        gasLimit: calculateGasMargin(estimatedGas),
      })

      addTransaction(response, {
        type: TransactionType.CLAIM_FARM,
        pid: pairData.pid,
        amount: formatNumber(Number(rewardsAmount)),
        tokenAddress: rewardTokenAddress?.result?.toString(),
      })
      const receipt = await response.wait()
      finalizedTransaction(receipt, {
        summary: 'claimrewards',
      })
      stateTransaction(false, true, undefined, receipt.transactionHash)
      setAttemptClaiming(false)
    } catch (e) {
      stateTransaction(false, true, e.message, undefined)
      setAttemptClaiming(false)
      console.log('err: ', e)
    }
  }

  const [{ showTransactionClaimModal, transactionErrorMessage, attemptingTxn, txHash }, setTransactionClaimModal] =
    useState<{
      showTransactionClaimModal: boolean
      attemptingTxn: boolean
      transactionErrorMessage?: string
      txHash?: string
    }>({
      showTransactionClaimModal: false,
      attemptingTxn: false,
      transactionErrorMessage: undefined,
      txHash: undefined,
    })

  const [
    { showTransactionDepositModal, transactionDepositErrorMessage, attemptingDepositTxn, txHashDeposit },
    setTransactionDepositModal,
  ] = useState<{
    showTransactionDepositModal: boolean
    attemptingDepositTxn: boolean
    transactionDepositErrorMessage?: string
    txHashDeposit?: string
  }>({
    showTransactionDepositModal: false,
    attemptingDepositTxn: false,
    transactionDepositErrorMessage: undefined,
    txHashDeposit: undefined,
  })

  const [
    { showTransactionWithdrawModal, transactionWithdrawErrorMessage, attemptingWithdrawTxn, txHashWithdraw },
    setTransactionWithdrawModal,
  ] = useState<{
    showTransactionWithdrawModal: boolean
    attemptingWithdrawTxn: boolean
    transactionWithdrawErrorMessage?: string
    txHashWithdraw?: string
  }>({
    showTransactionWithdrawModal: false,
    attemptingWithdrawTxn: false,
    transactionWithdrawErrorMessage: undefined,
    txHashWithdraw: undefined,
  })

  const handleDismissTransaction = useCallback(() => {
    setTransactionClaimModal({ showTransactionClaimModal: false, attemptingTxn, transactionErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setUnStakeAmount('')
      forceUpdate()
    }
  }, [attemptingTxn, forceUpdate, transactionErrorMessage, txHash])

  const handleDismissTransactionDeposit = useCallback(() => {
    setTransactionDepositModal({
      showTransactionDepositModal: false,
      attemptingDepositTxn,
      transactionDepositErrorMessage,
      txHashDeposit,
    })
    // if there was a tx hash, we want to clear the input
    if (txHashDeposit) {
      setUnStakeAmount('')
      forceUpdate()
    }
  }, [attemptingDepositTxn, forceUpdate, transactionDepositErrorMessage, txHashDeposit])

  const handleDismissTransactionWithdraw = useCallback(() => {
    setTransactionWithdrawModal({
      showTransactionWithdrawModal: false,
      attemptingWithdrawTxn,
      transactionWithdrawErrorMessage,
      txHashWithdraw,
    })
    // if there was a tx hash, we want to clear the input
    if (txHashDeposit) {
      setUnStakeAmount('')
      forceUpdate()
    }
  }, [attemptingWithdrawTxn, forceUpdate, transactionWithdrawErrorMessage, txHashDeposit, txHashWithdraw])

  // text to show while loading
  const pendingTextClaim = useMemo(
    () => `Claiming ${formatNumber(Number(rewardsAmount))} ${rewardToken?.symbol}`,
    [rewardToken?.symbol, rewardsAmount]
  )

  const pendingTextDeposit = `Depositing ${formatNumber(Number(dataDetails.stakeAmount))} ${dataDetails.lpSymbol}`

  const pendingTextWithdraw = `Withdraw ${formatNumber(Number(unStakeAmount))} ${dataDetails.lpSymbol}`

  const modalHeader = () => {
    return (
      <AutoColumn>
        <Row style={{ padding: '20px', gap: '10px', display: 'flex', justifyContent: 'center' }}>
          {rewardToken && <CurrencyLogo currency={rewardToken} size="24px" />}
          <Text fontSize="18px">
            {'Claim' + ' '}
            {formatNumber(Number(rewardsAmount)) + ' '}
            <Text as="span" color={theme.accentActive}>
              {rewardToken?.symbol}
            </Text>
          </Text>
        </Row>
      </AutoColumn>
    )
  }

  const modalHeaderDeposit = () => {
    return (
      <AutoColumn>
        <Row style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Text fontSize="18px">
            {'Deposit' + ' '}
            {formatNumber(Number(dataDetails.stakeAmount)) + ' '}
            <Text as="span" color={theme.accentActive}>
              {dataDetails.lpSymbol}
            </Text>
          </Text>
        </Row>
      </AutoColumn>
    )
  }

  const modalHeaderApprove = () => {
    return (
      <AutoColumn>
        <Row style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Text fontSize="18px">
            {'Approve' + ' '}
            <Text as="span" color={theme.accentActive}>
              {dataDetails.lpSymbol}
            </Text>
          </Text>
        </Row>
      </AutoColumn>
    )
  }

  const modalHeaderWithdraw = () => {
    return (
      <AutoColumn>
        <Row style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Text fontSize="18px">
            {'Withdraw' + ' '}
            {formatNumber(Number(unStakeAmount)) + ' '}
            <Text as="span" color={theme.accentActive}>
              {dataDetails.lpSymbol}
            </Text>
          </Text>
        </Row>
      </AutoColumn>
    )
  }

  const stateTransaction = (
    attemptingTxn: boolean,
    showTransactionClaimModal: boolean,
    transactionErrorMessage: string | undefined,
    txHash: string | undefined
  ) => {
    setTransactionClaimModal({
      attemptingTxn,
      showTransactionClaimModal,
      transactionErrorMessage,
      txHash,
    })
  }

  const stateTransactionDeposit = (
    attemptingDepositTxn: boolean,
    showTransactionDepositModal: boolean,
    transactionDepositErrorMessage: string | undefined,
    txHashDeposit: string | undefined
  ) => {
    setTransactionDepositModal({
      attemptingDepositTxn,
      showTransactionDepositModal,
      transactionDepositErrorMessage,
      txHashDeposit,
    })
  }

  const stateTransactionWithdraw = (
    attemptingWithdrawTxn: boolean,
    showTransactionWithdrawModal: boolean,
    transactionWithdrawErrorMessage: string | undefined,
    txHashWithdraw: string | undefined
  ) => {
    setTransactionWithdrawModal({
      attemptingWithdrawTxn,
      showTransactionWithdrawModal,
      transactionWithdrawErrorMessage,
      txHashWithdraw,
    })
  }

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showTransactionClaimModal}
        onDismiss={handleDismissTransaction}
        attemptingTxn={attemptingTxn}
        pendingText={pendingTextClaim}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Transaction summary</Trans>}
            onDismiss={handleDismissTransaction}
            topContent={modalHeader}
            bottomContent={() => (
              <ButtonPrimary style={{ marginTop: '0.5rem' }} onClick={claimReward}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>Claim</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
      />

      <TransactionConfirmationModal
        isOpen={showTransactionDepositModal}
        onDismiss={handleDismissTransactionDeposit}
        attemptingTxn={attemptingDepositTxn}
        pendingText={pendingTextDeposit}
        hash={txHashDeposit}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Transaction summary</Trans>}
            onDismiss={handleDismissTransactionDeposit}
            topContent={dataDetails.approval === ApprovalState.APPROVED ? modalHeaderDeposit : modalHeaderApprove}
            bottomContent={() => (
              <ButtonPrimary style={{ marginTop: '0.5rem' }} onClick={approveOrStakeLP}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>{dataDetails.approval === ApprovalState.APPROVED ? 'Deposit' : 'Approve'}</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
      />
      <TransactionConfirmationModal
        isOpen={showTransactionWithdrawModal}
        onDismiss={handleDismissTransactionWithdraw}
        attemptingTxn={attemptingWithdrawTxn}
        pendingText={pendingTextWithdraw}
        hash={txHashWithdraw}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Transaction summary</Trans>}
            onDismiss={handleDismissTransactionWithdraw}
            topContent={modalHeaderWithdraw}
            bottomContent={() => (
              <ButtonPrimary style={{ marginTop: '0.5rem' }} onClick={unStakeLP}>
                <Text fontWeight={500} fontSize={20}>
                  <Trans>Withdraw Tokens</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
      />

      <Box width="100%">
        {!isMobile && <Divider margin="none" />}
        {isMobile && (
          <>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'column',
                  fontWeight: 600,
                }}
              >
                <small style={{ color: theme.accentActive }}>TVL</small>
                {rewardData?.tvl && <small style={{ fontWeight: 600 }}> ${formatNumber(rewardData.tvl)}</small>}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'column',
                }}
              >
                <small style={{ color: theme.accentActive }}>Rewards</small>
                <small style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {rewardsAmount &&
                    Number(rewardsAmount) > 0 &&
                    token &&
                    `${formatNumber(Number(rewardsAmount) * 3600 * 24)} ${token.symbol} / day`}
                </small>
              </div>
            </div>
            <Divider margin="none" />
          </>
        )}

        <div style={{ padding: 1.5 }}>
          <Grid isMobile={isMobile} hasRewards={Number(rewardsAmount) > 0}>
            <GridItemGammaCard
              titleText="Available:"
              approveOrStakeLP={() =>
                setTransactionDepositModal({
                  attemptingDepositTxn: false,
                  showTransactionDepositModal: true,
                  transactionDepositErrorMessage: undefined,
                  txHashDeposit: undefined,
                })
              }
              availableStakeAmount={dataDetails.availableStakeAmount}
              availableStakeUSD={dataDetails.availableStakeUSD}
              stakeAmount={dataDetails.stakeAmount}
              setStakeAmount={dataDetails.setStakeAmount}
              stakeButtonDisabled={stakeButtonDisabled}
              textButton={
                dataDetails.approval === ApprovalState.APPROVED
                  ? approveOrStaking
                    ? 'Depositing'
                    : 'Deposit'
                  : approveOrStaking
                  ? 'Approving'
                  : 'Approve'
              }
              setUnStakeAmount={setUnStakeAmount}
              tokenLPSymbol={dataDetails.lpSymbol}
            />

            <GridItemGammaCard
              titleText="Deposited:"
              stakedUSD={dataDetails.stakedUSD}
              setUnStakeAmount={setUnStakeAmount}
              stakedAmount={dataDetails.stakedAmount}
              unStakeAmount={unStakeAmount}
              unStakeButtonDisabled={unStakeButtonDisabled}
              textButton={attemptUnstaking ? 'Withdrawing' : 'Withdraw'}
              setStakeAmount={dataDetails.setStakeAmount}
              stakeAmount={dataDetails.stakeAmount}
              unStakeLP={() =>
                setTransactionWithdrawModal({
                  attemptingWithdrawTxn: false,
                  showTransactionWithdrawModal: true,
                  transactionWithdrawErrorMessage: undefined,
                  txHashWithdraw: undefined,
                })
              }
              tokenLPSymbol={dataDetails.lpSymbol}
            />

            {rewardToken && (
              <GridItem>
                <ClaimContainer>
                  <small style={{ color: theme.textSecondary }}>Earned Rewards: </small>
                  <div style={{ marginBottom: 10, marginTop: 10 }}>
                    <div
                      key={rewardToken.address}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <CurrencyLogo currency={rewardToken} size="16px" />
                      <div style={{ marginLeft: '6px' }}>
                        <small>
                          {formatNumber(Number(rewardsAmount))} {rewardToken.symbol}
                        </small>
                      </div>
                    </div>
                  </div>
                  <Box width="100%">
                    <ButtonPrimary
                      style={{ height: '40px' }}
                      disabled={claimButtonDisabled}
                      onClick={() =>
                        setTransactionClaimModal({
                          attemptingTxn: false,
                          showTransactionClaimModal: true,
                          transactionErrorMessage: undefined,
                          txHash: undefined,
                        })
                      }
                    >
                      {attemptClaiming ? 'Claiming' : 'Claim'}
                    </ButtonPrimary>
                  </Box>
                </ClaimContainer>
              </GridItem>
            )}
          </Grid>
        </div>
      </Box>
    </>
  )
}

export default GammaFarmCardDetails
