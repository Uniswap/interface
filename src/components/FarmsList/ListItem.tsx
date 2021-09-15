/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { ethers } from 'ethers'
import { MaxUint256 } from '@ethersproject/constants'
import { BigNumber } from '@ethersproject/bignumber'
import { useMedia } from 'react-use'

import { ChainId, Fraction, JSBI, Token, TokenAmount } from 'libs/sdk/src'
import { ZERO } from 'libs/sdk/src/constants'
import { DMM_ANALYTICS_URL } from '../../constants'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { Dots } from 'components/swap/styleds'
import { ButtonPrimary } from 'components/Button'
import { AutoRow } from 'components/Row'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Farm, Reward } from 'state/farms/types'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useTokenBalance from 'hooks/useTokenBalance'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useFairLaunch from 'hooks/useFairLaunch'
import useStakedBalance from 'hooks/useStakedBalance'
import { formattedNum, getTokenSymbol, getTokenLogoURL, isAddressString, shortenAddress } from 'utils'
import { formatTokenBalance, getFullDisplayBalance } from 'utils/formatBalance'
import { getTradingFeeAPR, useFarmApr, useFarmRewardPerBlocks, useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import { ExternalLink } from 'theme'
import { RewardToken } from 'pages/Farms/styleds'
import { currencyIdFromAddress } from 'utils/currencyId'
import { useBlockNumber } from 'state/application/hooks'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'

const fixedFormatting = (value: BigNumber, decimals: number) => {
  const fraction = new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

  if (fraction.equalTo(ZERO)) {
    return '0'
  }

  return fraction.toFixed(18)
}

const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 0.25fr;
  grid-template-areas: 'pools liq end apy reward staked_balance expand';
  padding: 15px 36px 13px 26px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.bg15};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.advancedBorder)};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};

  &:hover {
    cursor: pointer;
  }
`

const ExpandedSection = styled.div`
  background-color: ${({ theme }) => theme.bg15};
  padding: 0 36px;
`

export const ExpandedContent = styled.div`
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    background-color: ${({ theme }) => theme.evenRow};
    margin-bottom: 1rem;
  `};
`

const StakeGroup = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 3fr 3fr 2fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
    grid-template-areas: 'stake';
    grid-gap: 1rem;
  `};
`

const BalanceInfo = styled.div`
  display: flex;
  justify-content: space-between;
`

const GreyText = styled.div`
  color: ${({ theme }) => theme.primaryText2};
  margin-bottom: 8px;
`

const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  `};
`

const LPInfo = styled.div`
  margin-right: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #08a1e7;
  line-height: 2;
`

const GetLP = styled.span`
  font-size: 14px;
  font-weight: 600;
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg13};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    margin-bottom: 20px;
  `}
`

const RewardBalanceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`

const RewardUSD = styled.div`
  color: ${({ theme }) => theme.primaryText2};
`

const DataText = styled(Flex)<{ align?: string }>`
  color: ${({ theme }) => theme.text7};
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    font-size: 14px;
  `}
`

const APY = styled(DataText)`
  color: ${({ theme }) => theme.text12};
`

const GridItem = styled.div<{ noBorder?: boolean }>`
  position: relative;
  margin-top: 8px;
  margin-bottom: 8px;
  border-bottom: ${({ theme, noBorder }) => (noBorder ? 'none' : `1px dashed ${theme.border}`)};
  padding-bottom: 12px;
`

const DataTitle = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${({ theme }) => theme.text6};
  &:hover {
    opacity: 0.6;
  }
  user-select: none;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-size: 12px;
`

const Seperator = styled.div`
  border: 1px solid ${({ theme }) => theme.bg14};
`

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

const ListItem = ({ farm }: ListItemProps) => {
  const { chainId } = useActiveWeb3React()
  const [expand, setExpand] = useState<boolean>(false)
  const xxlBreakpoint = useMedia('(min-width: 1200px)')
  const currentBlock = useBlockNumber()

  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token

  const poolAddressChecksum = isAddressString(farm.id)
  const { value: userTokenBalance, decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  const userStakedBalance = farm.userData?.stakedBalance
    ? BigNumber.from(farm.userData?.stakedBalance)
    : BigNumber.from(0)

  const farmRewards = useFarmRewards([farm])
  const farmRewardPerBlocks = useFarmRewardPerBlocks([farm])

  // Check if pool is active for liquidity mining
  const isLiquidityMiningActive =
    currentBlock && farm.startBlock && farm.endBlock
      ? farm.startBlock <= currentBlock && currentBlock <= farm.endBlock
      : false

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  // Ratio in % of user's LP tokens balance, vs the total number in circulation
  const lpUserLPBalanceRatio = new Fraction(
    userTokenBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  const userToken0Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userToken1Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  // Ratio in % of LP tokens that user staked, vs the total number in circulation
  const lpUserStakedTokenRatio = new Fraction(
    userStakedBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
    )
  )

  const userStakedToken0Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userStakedToken1Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  const userLPBalanceUSD = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const userStakedBalanceUSD = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farmRewardPerBlocks, liquidity.toString(), isLiquidityMiningActive)

  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)

  const apr = farmAPR + tradingFeeAPR
  const amp = farm.amp / 10000

  const pairSymbol = `${farm.token0.symbol}-${farm.token1.symbol} LP`
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(farm.id)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(farm.fairLaunchAddress, farm.pid)
  const rewardUSD = useFarmRewardsUSD(farmRewards)

  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    !!chainId ? farm.fairLaunchAddress : undefined
  )

  let isStakeInvalidAmount

  try {
    isStakeInvalidAmount =
      depositValue === '' ||
      parseFloat(depositValue) === 0 ||
      ethers.utils.parseUnits(depositValue || '0', balance.decimals).gt(balance.value) // This causes error if number of decimals > 18
  } catch (err) {
    isStakeInvalidAmount = true
  }

  const isStakeDisabled = pendingTx || isStakeInvalidAmount

  let isUnstakeInvalidAmount

  try {
    isUnstakeInvalidAmount =
      withdrawValue === '' ||
      parseFloat(withdrawValue) === 0 ||
      ethers.utils.parseUnits(withdrawValue || '0', staked.decimals).gt(staked.value) // This causes error if number of decimals > 18
  } catch (err) {
    isUnstakeInvalidAmount = true
  }

  const isUnstakeDisabled = pendingTx || isUnstakeInvalidAmount

  const canHarvest = (rewards: Reward[]): boolean => {
    const canHarvest = rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

    return canHarvest
  }

  const isHarvestDisabled = pendingTx || !canHarvest(farmRewards)

  const { deposit, withdraw, harvest } = useFairLaunch(farm.fairLaunchAddress)

  const handleClickStake = async (pid: number) => {
    setPendingTx(true)
    await deposit(pid, ethers.utils.parseUnits(depositValue, balance.decimals), pairSymbol, false)
    setPendingTx(false)
  }

  const handleWithdraw = async (pid: number) => {
    setPendingTx(true)
    await withdraw(pid, ethers.utils.parseUnits(withdrawValue, staked.decimals), pairSymbol)
    setPendingTx(false)
  }

  const handleClickHarvest = async (pid: number) => {
    setPendingTx(true)
    await harvest(pid, pairSymbol)
    setPendingTx(false)
  }

  return xxlBreakpoint ? (
    <>
      <TableRow isExpanded={expand} onClick={() => setExpand(!expand)}>
        <DataText grid-area="pools">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
              <span>
                {farm.token0?.symbol} - {farm.token1?.symbol} (AMP = {amp})
              </span>
            </>
          </div>
        </DataText>
        <DataText grid-area="liq" align="center">
          {formattedNum(liquidity.toString(), true)}
        </DataText>
        <DataText grid-area="liq" align="right">
          {farm.time}
        </DataText>
        <APY grid-area="apy">
          {apr.toFixed(2)}%
          {apr != 0 && <InfoHelper text={t`${tradingFeeAPR.toFixed(2)}% LP Fee + ${farmAPR.toFixed(2)}% Rewards`} />}
        </APY>
        <DataText
          grid-area="reward"
          align="right"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
        >
          {farmRewards.map((reward, index) => {
            return (
              <div key={reward.token.address} style={{ marginTop: '2px' }}>
                <Flex style={{ alignItems: 'center' }}>
                  {getFullDisplayBalance(reward?.amount)}
                  <img
                    src={`${getTokenLogoURL(reward.token.address, chainId)}`}
                    alt="logo"
                    width="20px"
                    style={{ marginLeft: '3px' }}
                  />
                </Flex>
              </div>
            )
          })}
        </DataText>
        <DataText grid-area="staked_balance" align="right">
          {formattedNum(userStakedBalanceUSD.toString(), true)}
        </DataText>
        <ExpandableSectionButton expanded={expand} />
      </TableRow>

      {expand && (
        <ExpandedSection>
          <ExpandedContent>
            <StakeGroup style={{ marginBottom: '14px' }}>
              <div>
                <BalanceInfo grid-area="stake">
                  <GreyText>
                    <Trans>
                      Balance: {getFullDisplayBalance(userTokenBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                      {farm.token1?.symbol} LP
                    </Trans>
                  </GreyText>
                  <GreyText>{formattedNum(userLPBalanceUSD.toString(), true)}</GreyText>
                </BalanceInfo>
                <GreyText>
                  {formatTokenBalance(userToken0Balance)} {farm.token0?.symbol} -{' '}
                  {formatTokenBalance(userToken1Balance)} {farm.token1?.symbol}
                </GreyText>
              </div>
              <div>
                <BalanceInfo grid-area="unstake">
                  <GreyText>
                    <Trans>
                      Deposit: {getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                      {farm.token1?.symbol} LP
                    </Trans>
                  </GreyText>
                  <GreyText>{formattedNum(userStakedBalanceUSD.toString(), true)}</GreyText>
                </BalanceInfo>
                <GreyText>
                  {formatTokenBalance(userStakedToken0Balance)} {farm.token0?.symbol} -{' '}
                  {formatTokenBalance(userStakedToken1Balance)} {farm.token1?.symbol}
                </GreyText>
              </div>
              <div grid-area="harvest">
                <GreyText>
                  <Trans>Reward</Trans>
                </GreyText>
              </div>
            </StakeGroup>
            <StakeGroup>
              <>
                {approvalState === ApprovalState.UNKNOWN && <Dots></Dots>}
                {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
                  <div className="px-4">
                    <ButtonPrimary color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
                      {approvalState === ApprovalState.PENDING ? (
                        <Dots>
                          <Trans>Approving </Trans>
                        </Dots>
                      ) : (
                        <Trans>Approve</Trans>
                      )}
                    </ButtonPrimary>
                  </div>
                )}
                {approvalState === ApprovalState.APPROVED && (
                  <>
                    <AutoRow justify="space-between">
                      {chainId && (
                        <>
                          <CurrencyInputPanel
                            value={depositValue}
                            onUserInput={value => {
                              setDepositValue(value)
                            }}
                            onMax={() => {
                              setDepositValue(fixedFormatting(balance.value, balance.decimals))
                            }}
                            showMaxButton={true}
                            currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                            id="stake-lp-input"
                            disableCurrencySelect
                            balancePosition="left"
                            hideBalance={true}
                            hideLogo={true}
                            fontSize="14px"
                          />

                          <ButtonPrimary
                            disabled={isStakeDisabled}
                            padding="12px"
                            margin="14px 0"
                            onClick={() => handleClickStake(farm.pid)}
                          >
                            {depositValue && isStakeInvalidAmount ? 'Invalid Amount' : 'Stake'}
                          </ButtonPrimary>
                        </>
                      )}
                    </AutoRow>
                    <AutoRow justify="space-between">
                      {chainId && (
                        <>
                          <CurrencyInputPanel
                            value={withdrawValue}
                            onUserInput={value => {
                              setWithdrawValue(value)
                            }}
                            onMax={() => {
                              setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                            }}
                            showMaxButton={true}
                            currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                            id="unstake-lp-input"
                            disableCurrencySelect
                            customBalanceText={`Deposited LP: ${fixedFormatting(staked.value, staked.decimals)}`}
                            balancePosition="left"
                            hideBalance={true}
                            hideLogo={true}
                            fontSize="14px"
                          />

                          <ButtonPrimary
                            disabled={isUnstakeDisabled}
                            padding="12px"
                            margin="14px 0"
                            onClick={() => handleWithdraw(farm.pid)}
                          >
                            {withdrawValue && isUnstakeInvalidAmount ? 'Invalid Amount' : 'Unstake'}
                          </ButtonPrimary>
                        </>
                      )}
                    </AutoRow>
                    <AutoRow justify="space-between" align="flex-start" style={{ flexDirection: 'column' }}>
                      <RewardBalanceWrapper>
                        <div>
                          {farmRewards?.map((reward, index) => {
                            return (
                              <div key={reward.token.address}>
                                <Flex style={{ alignItems: 'center' }}>
                                  {getFullDisplayBalance(reward?.amount)}
                                  <img
                                    src={`${getTokenLogoURL(reward.token.address, chainId)}`}
                                    alt="logo"
                                    width="20px"
                                    style={{ marginLeft: '3px' }}
                                  />
                                </Flex>
                              </div>
                            )
                          })}
                        </div>
                        <RewardUSD>{rewardUSD && formattedNum(rewardUSD.toString(), true)}</RewardUSD>
                      </RewardBalanceWrapper>
                      <ButtonPrimary
                        disabled={isHarvestDisabled}
                        padding="12px"
                        margin="15px 0"
                        onClick={() => handleClickHarvest(farm.pid)}
                      >
                        <Trans>Harvest</Trans>
                      </ButtonPrimary>
                    </AutoRow>
                  </>
                )}
              </>
            </StakeGroup>
            <LPInfoContainer>
              <ExternalLink href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${farm.id}`}>
                <LPInfo>{shortenAddress(farm.id)}</LPInfo>
              </ExternalLink>
              <Link
                to={`/add/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
                  farm.token1?.id,
                  chainId
                )}/${farm.id}`}
                style={{ textDecoration: 'none' }}
              >
                <GetLP>
                  <Trans>
                    Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                  </Trans>
                </GetLP>
              </Link>
            </LPInfoContainer>
          </ExpandedContent>
        </ExpandedSection>
      )}
    </>
  ) : (
    <>
      <StyledItemCard onClick={() => setExpand(!expand)}>
        <GridItem style={{ gridColumn: '1 / span 2' }}>
          <DataTitle>
            <span>Pool | AMP</span>
            <InfoHelper
              text={
                'AMP = Amplification factor. Amplified pools have higher capital efficiency. Higher AMP, higher capital efficiency and amplified liquidity within a price range.'
              }
              size={12}
            />
          </DataTitle>
          <DataText grid-area="pools">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
                <span>
                  {farm.token0?.symbol} - {farm.token1?.symbol} (AMP = {amp})
                </span>
              </>
            </div>
          </DataText>

          <span style={{ position: 'absolute', top: '0', right: '0' }}>
            <ExpandableSectionButton expanded={expand} />
          </span>
        </GridItem>

        <GridItem>
          <DataTitle>
            <span>
              <Trans>Staked TVL</Trans>
            </span>
          </DataTitle>
          <DataText grid-area="liq">
            <div>{formattedNum(liquidity.toString(), true)}</div>
          </DataText>
        </GridItem>
        <GridItem>
          <DataTitle>
            <span>
              <Trans>APY</Trans>
            </span>
            <InfoHelper text={'Estimated total annualized yield from fees + rewards'} size={12} />
          </DataTitle>
          <DataText grid-area="apy">
            <APY grid-area="apy">{apr.toFixed(2)}%</APY>
          </DataText>
        </GridItem>

        <GridItem noBorder>
          <DataTitle>
            <Trans>My Rewards</Trans>
          </DataTitle>
          <DataText style={{ display: 'flex', flexDirection: 'column' }}>
            {farmRewards.map((reward, index) => {
              return (
                <div key={reward.token.address} style={{ marginTop: '2px' }}>
                  <Flex style={{ alignItems: 'center' }}>
                    {getFullDisplayBalance(reward?.amount)}
                    <img
                      src={`${getTokenLogoURL(reward.token.address, chainId)}`}
                      alt="logo"
                      width="20px"
                      style={{ marginLeft: '3px' }}
                    />
                  </Flex>
                </div>
              )
            })}
          </DataText>
        </GridItem>

        <GridItem noBorder>
          <DataTitle>
            <Trans>My Deposit</Trans>
          </DataTitle>
          <DataText>{formattedNum(userStakedBalanceUSD.toString(), true)}</DataText>
        </GridItem>
      </StyledItemCard>

      {expand && (
        <ExpandedContent>
          <StakeGroup style={{ marginBottom: '14px' }}>
            <div>
              <BalanceInfo grid-area="stake">
                <GreyText>
                  <Trans>
                    Balance: {getFullDisplayBalance(userTokenBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                    {farm.token1?.symbol} LP
                  </Trans>
                </GreyText>
                <GreyText>{formattedNum(userLPBalanceUSD.toString(), true)}</GreyText>
              </BalanceInfo>
              <GreyText>
                {formatTokenBalance(userToken0Balance)} {farm.token0?.symbol} - {formatTokenBalance(userToken1Balance)}{' '}
                {farm.token1?.symbol}
              </GreyText>
            </div>

            {approvalState === ApprovalState.UNKNOWN && <Dots></Dots>}
            {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
              <div className="px-4">
                <ButtonPrimary color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
                  {approvalState === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving </Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve</Trans>
                  )}
                </ButtonPrimary>
              </div>
            )}
            {approvalState === ApprovalState.APPROVED && (
              <>
                <AutoRow justify="space-between">
                  {chainId && (
                    <>
                      <CurrencyInputPanel
                        value={depositValue}
                        onUserInput={value => {
                          setDepositValue(value)
                        }}
                        onMax={() => {
                          setDepositValue(fixedFormatting(balance.value, balance.decimals))
                        }}
                        showMaxButton={true}
                        currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                        id="stake-lp-input"
                        disableCurrencySelect
                        balancePosition="left"
                        hideBalance={true}
                        hideLogo={true}
                        fontSize="14px"
                      />

                      <ButtonPrimary
                        disabled={isStakeDisabled}
                        padding="12px"
                        margin="14px 0"
                        onClick={() => handleClickStake(farm.pid)}
                      >
                        {depositValue && isStakeInvalidAmount ? 'Invalid Amount' : 'Stake'}
                      </ButtonPrimary>
                    </>
                  )}
                </AutoRow>
              </>
            )}

            <LPInfoContainer>
              <ExternalLink href={`${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${farm.id}`}>
                <LPInfo>{shortenAddress(farm.id)}</LPInfo>
              </ExternalLink>
              <Link
                to={`/add/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
                  farm.token1?.id,
                  chainId
                )}/${farm.id}`}
                style={{ textDecoration: 'none' }}
              >
                <GetLP>
                  <Trans>
                    Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                  </Trans>
                </GetLP>
              </Link>
            </LPInfoContainer>

            <Seperator />

            <div>
              <BalanceInfo grid-area="unstake">
                <GreyText>
                  <Trans>
                    Deposit: {getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                    {farm.token1?.symbol} LP
                  </Trans>
                </GreyText>
                <GreyText>{formattedNum(userStakedBalanceUSD.toString(), true)}</GreyText>
              </BalanceInfo>
              <GreyText>
                {formatTokenBalance(userStakedToken0Balance)} {farm.token0?.symbol} -{' '}
                {formatTokenBalance(userStakedToken1Balance)} {farm.token1?.symbol}
              </GreyText>
            </div>

            {approvalState === ApprovalState.APPROVED && (
              <AutoRow justify="space-between">
                {chainId && (
                  <>
                    <CurrencyInputPanel
                      value={withdrawValue}
                      onUserInput={value => {
                        setWithdrawValue(value)
                      }}
                      onMax={() => {
                        setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                      }}
                      showMaxButton={true}
                      currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                      id="unstake-lp-input"
                      disableCurrencySelect
                      customBalanceText={`Deposited LP: ${fixedFormatting(staked.value, staked.decimals)}`}
                      balancePosition="left"
                      hideBalance={true}
                      hideLogo={true}
                      fontSize="14px"
                    />

                    <ButtonPrimary
                      disabled={isUnstakeDisabled}
                      padding="12px"
                      margin="14px 0"
                      onClick={() => handleWithdraw(farm.pid)}
                    >
                      {withdrawValue && isUnstakeInvalidAmount ? 'Invalid Amount' : 'Unstake'}
                    </ButtonPrimary>
                  </>
                )}
              </AutoRow>
            )}

            <Seperator />

            <div grid-area="harvest">
              <GreyText>
                <Trans>Reward</Trans>
              </GreyText>
            </div>

            {approvalState === ApprovalState.APPROVED && (
              <AutoRow justify="space-between" align="flex-start" style={{ flexDirection: 'column' }}>
                <RewardBalanceWrapper>
                  <div>
                    {farmRewards?.map((reward, index) => {
                      return (
                        <div key={reward.token.address} style={{ marginTop: '2px' }}>
                          <Flex style={{ alignItems: 'center' }}>
                            {getFullDisplayBalance(reward?.amount)}
                            <img
                              src={`${getTokenLogoURL(reward.token.address, chainId)}`}
                              alt="logo"
                              width="20px"
                              style={{ marginLeft: '3px' }}
                            />
                          </Flex>
                        </div>
                      )
                    })}
                  </div>
                  <RewardUSD>{rewardUSD && formattedNum(rewardUSD.toString(), true)}</RewardUSD>
                </RewardBalanceWrapper>
                <ButtonPrimary
                  disabled={isHarvestDisabled}
                  padding="12px"
                  margin="15px 0"
                  onClick={() => handleClickHarvest(farm.pid)}
                >
                  <Trans>Harvest</Trans>
                </ButtonPrimary>
              </AutoRow>
            )}
          </StakeGroup>
        </ExpandedContent>
      )}
    </>
  )
}

export default ListItem
