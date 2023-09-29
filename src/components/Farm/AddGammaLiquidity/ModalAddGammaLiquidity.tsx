import { Trans } from '@lingui/macro'
import { Token } from '@pollum-io/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
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

import { depositUniProxy, getDepositAmounts, getValidationText, withdrawHypervisor } from '../utils'
import { GridItemAddLiquidity } from './GridItemAddLiquidity'

const Wrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
`

const Body = styled.div`
  padding-top: 10px;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
`

const Container = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? 'column' : 'row')};
  justify-content: space-between;
  align-items: center;
`

const Deposit = styled.div`
  width: 300px;
`

const ApprovedArea = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
`

const DepositButton = styled.div`
  display: flex;
  width: 100%;
  padding-left: 20px;
  padding-right: 20px;
`

const Withdraw = styled.div`
  width: 300px;
`
interface ModalProps {
  modalOpen: boolean
  handleDismiss: () => void
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
  lpTokenBalance: string
}

export default function ModalAddGammaLiquidity({
  modalOpen,
  handleDismiss,
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
  lpTokenBalance,
}: ModalProps) {
  const finalizedTransaction = useTransactionFinalizer()
  const addTransaction = useTransactionAdder()
  const isMobile = useIsMobile()
  const { account } = useWeb3React()
  const validationTextButton0 = getValidationText(approvalToken0, tokenStake0)
  const validationTextButton1 = getValidationText(approvalToken1, tokenStake1)

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
          <Body>
            <Container isMobile={isMobile}>
              <ApprovedArea>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
                  <Deposit>
                    <GridItemAddLiquidity
                      titleText="Deposit: "
                      availableStakeAmount={token0Balance}
                      textButton={validationTextButton0}
                      tokenSymbol={tokenStake0?.symbol || ''}
                      depositValue={deposit0}
                      disabledButton={
                        approvalToken0 === ApprovalState.APPROVED || approvalToken0 === ApprovalState.UNKNOWN
                      }
                      isApproved={
                        approvalToken0 === ApprovalState.APPROVED && approvalToken1 === ApprovalState.APPROVED
                      }
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
                  </Deposit>

                  <Deposit>
                    <GridItemAddLiquidity
                      titleText="Deposit: "
                      availableStakeAmount={token1Balance}
                      textButton={validationTextButton1}
                      tokenSymbol={tokenStake1?.symbol || ''}
                      depositValue={deposit1}
                      disabledButton={approvalToken1 === ApprovalState.UNKNOWN}
                      isApproved={
                        approvalToken0 === ApprovalState.APPROVED && approvalToken1 === ApprovalState.APPROVED
                      }
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
                  </Deposit>
                </div>

                {approvalToken0 === ApprovalState.APPROVED && approvalToken1 === ApprovalState.APPROVED && (
                  <DepositButton>
                    <ButtonPrimary
                      style={{ height: '40px', fontSize: '16px' }}
                      disabled={false}
                      onClick={() => {
                        if (uniProxyContract)
                          depositUniProxy(
                            uniProxyContract,
                            account,
                            approvalToken0,
                            approvalToken1,
                            pairData,
                            addTransaction,
                            token0Address,
                            token1Address,
                            deposit0,
                            deposit1,
                            finalizedTransaction
                          )
                      }}
                    >
                      Deposit via UniProxy
                    </ButtonPrimary>
                  </DepositButton>
                )}
              </ApprovedArea>

              {Number(lpTokenBalance) > 0 && (
                <Withdraw>
                  <GridItemAddLiquidity
                    titleText="Unstake Gamma: "
                    availableStakeAmount={lpTokenBalance}
                    textButton="Withdraw Gamma Liquidity"
                    tokenSymbol="LP"
                    depositValue={unStakeGamma}
                    disabledButton={false}
                    isApproved={false}
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
                </Withdraw>
              )}
            </Container>
          </Body>
        </Wrapper>
      </ModalAddLiquidity>
    </>
  )
}
