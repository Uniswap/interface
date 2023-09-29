import { Trans } from '@lingui/macro'
import { Token } from '@pollum-io/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { GridItemAddLiquidity } from 'components/Farm/AddGammaLiquidity/GridItemAddLiquidity'
import { getDepositAmounts, withdrawHypervisor } from 'components/Farm/utils'
import ModalAddLiquidity from 'components/ModalAddLiquidity'
import { RowBetween } from 'components/Row'
import { Contract } from 'ethers/lib/ethers'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useIsMobile } from 'nft/hooks'
import React from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import { useTransactionFinalizer } from 'utils/farmUtils'

const Wrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
`
const Grid = styled.div<{ isMobile: boolean; hasRewards: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: ${(props) => (props.isMobile ? 'none' : 'repeat(3, 1fr)')};
  grid-template-rows: ${(props) =>
    props.isMobile ? (props.hasRewards ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)') : 'none'};
  gap: 16px;
`

interface ModalProps {
  modalOpen: boolean
  handleDismiss: () => void
  rewardsAmount: string
  token0Balance: string
  approvalToken0: ApprovalState
  approvalToken1: ApprovalState
  tokenStake0?: Token | null
  tokenStake1?: Token | null
  uniProxyContract: Contract | null
  deposit0: string
  deposit1: string
  setDeposit0: (amount: string) => void
  setDeposit1: (amount: string) => void
  pairData: any
  approveCallbackToken0: () => void
  token0Address: string
  token1Address: string
  token1Balance: string
  approveCallbackToken1: () => void
  unStakeGamma: string
  setUnStakeGamma: React.Dispatch<React.SetStateAction<string>>
  hypervisorContract: Contract | null
}

export default function ModalAddGammaLiquidity({
  modalOpen,
  handleDismiss,
  rewardsAmount,
  token0Balance,
  approvalToken0,
  approvalToken1,
  tokenStake0,
  tokenStake1,
  uniProxyContract,
  deposit0,
  deposit1,
  setDeposit0,
  setDeposit1,
  pairData,
  approveCallbackToken0,
  token0Address,
  token1Address,
  token1Balance,
  approveCallbackToken1,
  unStakeGamma,
  setUnStakeGamma,
  hypervisorContract,
}: ModalProps) {
  const finalizedTransaction = useTransactionFinalizer()
  const addTransaction = useTransactionAdder()
  const isMobile = useIsMobile()
  const { account } = useWeb3React()

  return (
    <>
      <ModalAddLiquidity isOpen={modalOpen} onDismiss={handleDismiss}>
        <Wrapper>
          <HeaderRow>
            <ThemedText.SubHeader>
              <Trans>Add Gamma Liquidity</Trans>
            </ThemedText.SubHeader>
            <CloseIcon onClick={handleDismiss} />
          </HeaderRow>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              marginRight: isMobile ? 'none' : '15px',
              marginLeft: isMobile ? '15px' : 'none',
            }}
          >
            <Grid isMobile={isMobile} hasRewards={Number(rewardsAmount) > 0}>
              <GridItemAddLiquidity
                titleText="Deposit: "
                availableStakeAmount={token0Balance}
                textButton={
                  approvalToken0 === ApprovalState.PENDING
                    ? `Aproving Token ${tokenStake0?.symbol}`
                    : `Approve Token ${tokenStake0?.symbol}`
                }
                tokenSymbol={tokenStake0?.symbol || ''}
                depositValue={deposit0}
                disabledButton={approvalToken0 === ApprovalState.APPROVED}
                setDepositAmount={(amount: string) => {
                  setDeposit0(amount)
                  if (uniProxyContract)
                    getDepositAmounts(
                      0,
                      uniProxyContract,
                      setDeposit1,
                      setDeposit0,
                      pairData,
                      token0Address,
                      token1Address,
                      deposit0,
                      deposit1
                    )
                }}
                approveOrStakeLPOrWithdraw={approveCallbackToken0}
              />

              <GridItemAddLiquidity
                titleText="Deposit: "
                availableStakeAmount={token1Balance}
                textButton={
                  approvalToken0 === ApprovalState.PENDING
                    ? `Aproving Token ${tokenStake1?.symbol}`
                    : `Approve Token ${tokenStake1?.symbol}`
                }
                tokenSymbol={tokenStake1?.symbol || ''}
                depositValue={deposit1}
                disabledButton={approvalToken1 === ApprovalState.APPROVED}
                setDepositAmount={(amount: string) => {
                  setDeposit1(amount)
                  if (uniProxyContract)
                    getDepositAmounts(
                      1,
                      uniProxyContract,
                      setDeposit1,
                      setDeposit0,
                      pairData,
                      token0Address,
                      token1Address,
                      deposit0,
                      deposit1
                    )
                }}
                approveOrStakeLPOrWithdraw={approveCallbackToken1}
              />

              <GridItemAddLiquidity
                titleText="Unstake Gamma: "
                availableStakeAmount="0"
                textButton="Withdraw Gamma Liquidity"
                tokenSymbol="LP"
                depositValue={unStakeGamma}
                disabledButton={false}
                setDepositAmount={(amount: string) => {
                  setUnStakeGamma(amount)
                }}
                approveOrStakeLPOrWithdraw={() =>
                  withdrawHypervisor(
                    hypervisorContract,
                    account,
                    unStakeGamma,
                    pairData,
                    finalizedTransaction,
                    addTransaction
                  )
                }
              />
            </Grid>
          </div>
        </Wrapper>
      </ModalAddLiquidity>
    </>
  )
}
