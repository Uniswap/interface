import { AutoColumn } from 'components/Column'
import InputGroup from 'components/FarmsList/InputGroup'
import { FixedHeightRow } from 'components/PositionCard'
import { AutoRow, RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import AppBody from 'pages/AppBody'
import React, { useState } from 'react'
import styled from 'styled-components'
import { TYPE } from 'theme'

import { useHistory } from 'react-router-dom'
import { isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import useStakedBalance from 'hooks/useStakedBalance'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { Currency, Fraction, JSBI, Token, TokenAmount } from 'libs/sdk/src'
import { MASTERCHEF_ADDRESS } from 'constants/index'
import { MaxUint256 } from '@ethersproject/constants'
import useMasterChef from 'hooks/useMasterchef'
import { Dots } from 'components/swap/styleds'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { BigNumber } from '@ethersproject/bignumber'
import { Link } from 'rebass'
import usePendingRewardBalance from 'hooks/usePendingRewardBalance'

const PageWrapper = styled.div`
  padding: 0 17em;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 0 12rem;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 4em;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `};
`

const GridRow = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  column-gap: 6px;
  align-items: start;
  justify-content: space-between;
`
const Panel = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.advancedBG};
  box-sizing: border-box;
  box-shadow: 0 1.1px 2.8px -9px rgba(0, 0, 0, 0.008), 0 2.7px 6.7px -9px rgba(0, 0, 0, 0.012),
    0 5px 12.6px -9px rgba(0, 0, 0, 0.015), 0 8.9px 22.6px -9px rgba(0, 0, 0, 0.018),
    0 16.7px 42.2px -9px rgba(0, 0, 0, 0.022), 0 40px 101px -9px rgba(0, 0, 0, 0.03);
`

const PanelAutoRow = styled(AutoRow)<{ index: number }>`
  padding: 1.25rem;
  background: ${({ index }) => (index >= 0 && index % 2 == 0 ? '#303e46' : '#1f292e')};
  border-radius: ${({ index }) => (index == 0 ? '12px 12px 0 0' : index == -1 && '0 0 12px 12px')};
`

const fixedFormatting = (value: BigNumber, decimals: number) => {
  return new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(16)
}

const CurrencyInputPanel2 = styled(CurrencyInputPanel)`
  flex: 1;
`

const FarmDetail = ({
  pairAddress = '0x4F54C52D446605f324f30dDd79547D607255612E',
  pid = 0,
  pairSymbol = `KNCL-WETH LP`,
  token0Address,
  token1Address,
  type,
  assetSymbol,
  assetDecimals = 18
}: {
  pairAddress: string
  pid: number
  pairSymbol: string
  token0Address: string
  token1Address: string
  type?: string
  assetSymbol?: string
  assetDecimals?: number
}): JSX.Element => {
  const history = useHistory()
  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)

  const staked = useStakedBalance(pid, assetDecimals) // kMP depends on decimals of asset, SLP is always 18
  // const pending = usePendingSushi(pid)

  const pendingReward = usePendingRewardBalance(pid, assetDecimals)

  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    !!chainId ? MASTERCHEF_ADDRESS[chainId] : undefined
  )

  const { deposit, withdraw, harvest } = useMasterChef()

  // const toggleFarmClaimModal = useFarmClaimModalToggle()
  // const toggleFarmStakeModal = useFarmStakeModalToggle()

  const handleClickHarvest = async () => {
    // toggleFarmClaimModal()

    console.log('===harvest', pid)
    setPendingTx(true)
    await harvest(pid, pairSymbol)
    setPendingTx(false)
  }

  const handleClickStake = async () => {
    setPendingTx(true)
    await deposit(pid, depositValue, pairSymbol, false)
    setPendingTx(false)
    // toggleFarmStakeModal()
  }

  const handleWithdraw = async () => {
    console.log('===withdraw', pid, withdrawValue, pairSymbol)
    setPendingTx(true)
    await withdraw(pid, withdrawValue, pairSymbol)
    setPendingTx(false)
  }

  return (
    <>
      <PageWrapper>
        {(!account || !chainId) && <>import account pls</>}
        {!!account && !!chainId && (
          <>
            <GridRow>
              <Panel style={{ height: '100%', minHeight: '300px' }}>
                <PanelAutoRow justify="space-between" index={0}>
                  <RowFixed>
                    <TYPE.body>LINK-ETH</TYPE.body>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.body>$12345</TYPE.body>
                  </RowFixed>
                </PanelAutoRow>
                <PanelAutoRow justify="space-between" index={1}>
                  <RowFixed>
                    <TYPE.body>APY</TYPE.body>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.body>AMP</TYPE.body>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.body>END IN</TYPE.body>
                  </RowFixed>
                  <RowFixed>
                    <TYPE.body>ADDRESS</TYPE.body>
                  </RowFixed>
                </PanelAutoRow>
                {approvalState === ApprovalState.UNKNOWN && (
                  <PanelAutoRow justify="space-between" index={2}>
                    <Dots></Dots>
                  </PanelAutoRow>
                )}
                {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
                  <PanelAutoRow justify="space-between" index={2}>
                    <ButtonPrimary color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
                      {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : 'Approve'}
                    </ButtonPrimary>
                  </PanelAutoRow>
                )}
                {approvalState === ApprovalState.APPROVED && chainId && (
                  <>
                    <PanelAutoRow justify="space-between" index={2}>
                      <RowFixed style={{ flex: 1, marginRight: '20px' }}>
                        <CurrencyInputPanel
                          value={depositValue}
                          onUserInput={value => {
                            setDepositValue(value)
                          }}
                          onMax={() => {
                            setDepositValue(fixedFormatting(balance.value, balance.decimals))
                          }}
                          showMaxButton={true}
                          currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                          id="add-liquidity-input-token"
                          disableCurrencySelect
                          balancePosition="left"
                        />
                      </RowFixed>
                      <RowFixed>
                        <ButtonPrimary padding="18px 0" margin="23px 0 0 0" width="120px" onClick={handleClickStake}>
                          Stake
                        </ButtonPrimary>
                      </RowFixed>
                    </PanelAutoRow>
                    <PanelAutoRow justify="space-between" index={3}>
                      <RowFixed style={{ flex: 1, marginRight: '20px' }}>
                        <CurrencyInputPanel
                          value={withdrawValue}
                          onUserInput={value => {
                            setWithdrawValue(value)
                          }}
                          onMax={() => {
                            setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                          }}
                          showMaxButton={true}
                          currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                          id="remove-liquidity-input-token"
                          disableCurrencySelect
                          balancePosition="left"
                          customBalanceText={`Deposited LP: ${fixedFormatting(staked.value, staked.decimals)}`}
                        />
                      </RowFixed>
                      <RowFixed>
                        <ButtonPrimary padding="18px 0" margin="23px 0 0 0" width="120px" onClick={handleWithdraw}>
                          Unstake
                        </ButtonPrimary>
                      </RowFixed>
                    </PanelAutoRow>
                    <PanelAutoRow justify="space-between" index={4}>
                      <RowFixed>
                        KNC Reward <br></br>
                        {fixedFormatting(pendingReward.value, pendingReward.decimals)} KNC &nbsp;$12345
                      </RowFixed>
                      <ButtonPrimary padding="18px 0" width="120px" onClick={handleClickHarvest}>
                        Claim
                      </ButtonPrimary>
                    </PanelAutoRow>
                  </>
                )}
                <PanelAutoRow justify="center" index={-1}>
                  <Link href={`/swap`}>get LP</Link>
                </PanelAutoRow>
              </Panel>
              <Panel style={{ height: '100%', minHeight: '300px' }}></Panel>
            </GridRow>
          </>
        )}
      </PageWrapper>
    </>
  )
}

export default FarmDetail
