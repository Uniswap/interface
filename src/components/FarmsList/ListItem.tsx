import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'

import { Fraction, JSBI, Token } from 'libs/sdk/src'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Farm } from 'state/farms/types'
import { formattedNum, isAddressString, shortenAddress } from 'utils'
import { useFarmClaimModalToggle, useFarmStakeModalToggle } from 'state/application/hooks'
import InputGroup from './InputGroup'
import { useToken } from 'hooks/Tokens'
import useTokenBalance from 'hooks/useTokenBalance'
import { getFullDisplayBalance } from 'utils/formatBalance'

const TableRow = styled.div<{ fade?: boolean; isExpanded?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 2fr;
  grid-template-areas: 'pools liq apy reward staked_balance';
  padding: 15px 36px 13px 26px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.bg15};
  border: 1px solid transparent;
  border-bottom: 1px solid ${({ theme, isExpanded }) => (isExpanded ? 'transparent' : theme.advancedBorder)};

  &:hover {
    cursor: pointer;
  }
`

const ExpandedSection = styled.div`
  background-color: ${({ theme }) => theme.bg15};
  padding: 0 36px;
`

const ExpandedContent = styled.div`
  border-radius: 10px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 14px;
  font-weight: 500;
  padding: 16px 24px;
`

const StakeGroup = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 3fr 3fr 2fr;
  grid-template-areas: 'stake unstake harvest';
  margin-bottom: 20px;
`

const GreyText = styled.div`
  color: ${({ theme }) => theme.primaryText2};
  margin-bottom: 8px;
`

const LPInfoContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`

const LPInfo = styled.div`
  margin-right: 24px;
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg6};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 20px;
  `}
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

export const ItemCard = ({ farm }: ListItemProps) => {
  return (
    <div>
      <StyledItemCard>{farm.id}</StyledItemCard>
    </div>
  )
}

const ListItem = ({ farm }: ListItemProps) => {
  const { t } = useTranslation()
  const [expand, setExpand] = useState<boolean>(false)
  const toggleFarmClaimModal = useFarmClaimModalToggle()
  const toggleFarmStakeModal = useFarmStakeModalToggle()

  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token

  const poolAddressChecksum = isAddressString(farm.id)
  const { value: userTokenBalance, decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  const userStakedBalance = farm.userData?.stakedBalance
    ? BigNumber.from(farm.userData?.stakedBalance)
    : BigNumber.from(0)
  const userEarning = farm.userData?.earnings ? BigNumber.from(farm.userData?.earnings) : BigNumber.from(0)

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

  const token0Staked = new Fraction(
    ethers.utils.parseUnits(farm.reserve0, lpTokenDecimals).toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).multiply(lpTokenRatio)

  const token1Staked = new Fraction(
    ethers.utils.parseUnits(farm.reserve1, lpTokenDecimals).toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  ).multiply(lpTokenRatio)

  console.log('token0Staked', token0Staked.toSignificant(6))
  console.log('token1Staked', token1Staked.toSignificant(6))

  // const liquidityToken0 = token0Staked.multiply(
  //   new Fraction(
  //     ethers.utils.parseUnits(farm.token0Price, lpTokenDecimals).toString(),
  //     JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  //   )
  // )

  // const liquidityToken1 = token1Staked.multiply(
  //   new Fraction(
  //     ethers.utils.parseUnits(farm.token1Price, lpTokenDecimals).toString(),
  //     JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals))
  //   )
  // )

  // const liquidity = liquidityToken0.add(liquidityToken1)
  const liquidity = 0

  const amp = farm.amp / 10000

  const handleClickHarvest = () => {
    toggleFarmClaimModal()
  }

  const handleClickStake = () => {
    toggleFarmStakeModal()
  }

  return (
    <>
      <TableRow isExpanded={expand} onClick={() => setExpand(!expand)}>
        <DataText grid-area="pools">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {amp === 1 ? (
              <>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
                <span>
                  {farm.token0?.symbol} - {farm.token1?.symbol} (AMP = {amp})
                </span>
              </>
            ) : (
              <div />
            )}
          </div>
        </DataText>
        <DataText grid-area="liq">{liquidity}</DataText>
        <DataText grid-area="apy" style={{ color: 'rgba(137, 255, 120, 0.67)' }}>
          24.5%
        </DataText>
        <DataText grid-area="reward">{`${getFullDisplayBalance(userEarning)} KNC`}</DataText>
        <DataText grid-area="staked_balance">{`${getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} ${
          farm.token0?.symbol
        }-${farm.token1?.symbol} LP`}</DataText>
      </TableRow>

      {expand && (
        <ExpandedSection>
          <ExpandedContent>
            <StakeGroup style={{ marginBottom: '14px' }}>
              <div grid-area="stake">
                <GreyText>
                  Balance: {getFullDisplayBalance(userTokenBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                  {farm.token1?.symbol} LP
                </GreyText>
              </div>
              <div grid-area="unstake">
                <GreyText>
                  Deposit: {getFullDisplayBalance(userStakedBalance, lpTokenDecimals)} {farm.token0?.symbol}-
                  {farm.token1?.symbol} LP
                </GreyText>
              </div>
              <div grid-area="harvest">
                <GreyText>KNC Reward</GreyText>
                <div>{`${getFullDisplayBalance(userEarning)} KNC`}</div>
                <div>$940</div>
              </div>
            </StakeGroup>
            <StakeGroup>
              <InputGroup
                pid={farm.pid}
                pairAddress={farm.id}
                pairSymbol={`${farm.token0.symbol}-${farm.token1.symbol} LP`}
                token0Address={farm.token0.id}
                token1Address={farm.token1.id}
              />
              {/* <div grid-area="stake">
                <ButtonPrimary padding="12px" onClick={handleClickStake}>
                  Stake
                </ButtonPrimary>
              </div>
              <div grid-area="unstake">
                <ButtonPrimary padding="12px" onClick={handleClickStake}>
                  Unstake
                </ButtonPrimary>
              </div>
              <div grid-area="harvest">
                <ButtonPrimary padding="12px" onClick={handleClickHarvest}>
                  Harvest
                </ButtonPrimary>
              </div> */}
            </StakeGroup>
            <LPInfoContainer>
              <LPInfo>
                <div>{shortenAddress(farm.id)}</div>
              </LPInfo>
              <div>
                <Link to={`/add/${farm.token0?.id}/${farm.token1?.id}/${farm.id}`}>
                  Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                </Link>
              </div>
            </LPInfoContainer>
          </ExpandedContent>
        </ExpandedSection>
      )}
    </>
  )
}

export default ListItem
