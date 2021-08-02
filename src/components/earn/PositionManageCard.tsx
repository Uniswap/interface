import { Trans } from '@lingui/macro'
import { Pool, Position } from '@uniswap/v3-sdk'
import Badge, { GreenBadge } from 'components/Badge'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonLightGray, ButtonGreySmall, ButtonPrimary, ButtonSmall } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Loader'
import { getPriceOrderingFromPositionForUI } from 'components/PositionListItem'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import AppleToggle from 'components/Toggle/AppleToggle'
import { BigNumber } from 'ethers'
import { Incentive, useIncentivesForPool } from 'hooks/incentives/useAllIncentives'
import { DepositedTokenIdsState, useDepositedTokenIds } from 'hooks/incentives/useDepositedTokenIds'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Lock, Zap } from 'react-feather'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, HoverText, SmallOnly, TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Break } from './styled'

const Wrapper = styled.div<{ open?: boolean }>`
  width: 100%;
  border: 1px solid ${({ theme, open }) => (open ? theme.blue3 : theme.bg3)};
  border-radius: 12px;
  padding: 16px;
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  user-select: none;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background-color: ${({ theme }) => theme.bg2};
    border-radius: 12px;
    padding: 8px 0;
`};
`

const DoubleArrow = styled.span`
  margin: 0 2px;
  color: ${({ theme }) => theme.text3};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 4px;
    padding: 20px;
  `};
`

const RangeText = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  user-select: none;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `};
`

const HoverRow = styled(RowBetween)`
  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

const DynamicSection = styled.div<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  user-select: ${({ disabled }) => (disabled ? 'none' : 'inherit')};
`

interface BoostStatusRowProps {
  incentive: Incentive
  positionDetails: PositionDetails
}

function BoostStatusRow({ incentive, positionDetails }: BoostStatusRowProps) {
  const rewardCurrency = incentive.initialRewardAmount.currency
  /**
   * @TODO make these real
   */
  const availableClaim = incentive.initialRewardAmount
  const weeklyRewards = incentive.initialRewardAmount
  const isStaked = true

  const [attemptingUnstake, setAttemptingUnstake] = useState(false)

  const handleToggleStakeOn = () => {
    setAttemptingUnstake(true)
    console.log('toggle on')
  }

  const handleToggleStakeOff = () => {
    console.log('toggle on')
  }

  return (
    <RowBetween>
      <RowFixed>
        <CurrencyLogo currency={rewardCurrency} />
        <TYPE.body m="0 12px" fontSize="20px">{`${formatCurrencyAmount(availableClaim, 5)} ${
          rewardCurrency.symbol
        }`}</TYPE.body>
        <Badge>{`~ ${formatCurrencyAmount(weeklyRewards, 5)} ${rewardCurrency.symbol} / Week `}</Badge>
      </RowFixed>
      <AutoRow gap="8px" width="fit-content">
        <ButtonGreySmall>
          <Trans>Claim</Trans>
        </ButtonGreySmall>
        <AppleToggle isActive={isStaked && !attemptingUnstake} toggle={handleToggleStakeOn} />
      </AutoRow>
    </RowBetween>
  )
}

interface PositionManageCardProps {
  positionDetails: PositionDetails
}

export default function PositionManageCard({ positionDetails }: PositionManageCardProps) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = positionDetails

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  // meta data about position
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)
  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)
  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false
  const removed = liquidity?.eq(0)

  // incentives for this pool
  const poolAddress = pool ? Pool.getAddress(pool.token0, pool.token1, pool.fee) : undefined
  const { incentives, loading: incentivesLoading } = useIncentivesForPool(poolAddress)

  // toggle open state
  const [open, setOpen] = useState(false)

  // amount of programs where position is staked
  const amountBoosted = incentives
    ? incentives.reduce((accum, incentive) => {
        /**
         * @TODO get data about which positions are staked
         */
        accum += 0
        // accum += 1
        return accum
      }, 0)
    : 0

  /**
   * @TODO group incentives based on boosted or now for counts
   */
  // amount of programs where position is not staked
  // const amountAvailable = incentives ? incentives.length - amountBoosted : 0
  const amountAvailable = incentives ? incentives.length : 0

  const { state, tokenIds } = useDepositedTokenIds(account)

  // check if position is deposited into staker contract
  const isDeposited = Boolean(
    state === DepositedTokenIdsState.LOADED &&
      tokenIds &&
      tokenIds.find((id) => BigNumber.from(id.toString()).eq(positionDetails.tokenId))
  )

  /**
   * @TODO
   */
  const totalUnclaimedUSD = 0.023

  return (
    <Wrapper open={open}>
      {priceLower && priceUpper && incentives ? (
        <HoverRow onClick={() => setOpen(!open)}>
          <RowFixed>
            <RangeLineItem>
              <RangeBadge removed={removed} inRange={!outOfRange} />
              <RangeText>
                <ExtentsText>
                  <Trans>Min: </Trans>
                </ExtentsText>
                <Trans>
                  {formatTickPrice(priceLower, tickAtLimit, Bound.LOWER)}{' '}
                  <HoverInlineText text={currencyQuote?.symbol} /> per{' '}
                  <HoverInlineText text={currencyBase?.symbol ?? ''} />
                </Trans>
              </RangeText>{' '}
              <HideSmall>
                <DoubleArrow>⟷</DoubleArrow>{' '}
              </HideSmall>
              <SmallOnly>
                <DoubleArrow>⟷</DoubleArrow>{' '}
              </SmallOnly>
              <RangeText>
                <ExtentsText>
                  <Trans>Max:</Trans>
                </ExtentsText>
                <Trans>
                  {formatTickPrice(priceUpper, tickAtLimit, Bound.UPPER)}{' '}
                  <HoverInlineText text={currencyQuote?.symbol} /> per{' '}
                  <HoverInlineText maxCharacters={10} text={currencyBase?.symbol} />
                </Trans>
              </RangeText>
            </RangeLineItem>
          </RowFixed>

          <RowFixed height="36px">
            {amountBoosted > 0 && !open ? (
              <GreenBadge>
                <RowFixed style={{ flexWrap: 'nowrap' }}>
                  <Zap strokeWidth="3px" color={theme.green2} size="14px" />
                  <TYPE.body ml="4px" fontWeight={700} color={theme.green2} fontSize="12px">
                    <Trans>Boosted</Trans>
                  </TYPE.body>
                  {incentives.map((incentive, i) => (
                    <CurrencyLogo
                      key={'incentive-logo-' + i}
                      size="20px"
                      style={{ marginLeft: '6px' }}
                      currency={incentive.initialRewardAmount.currency}
                    />
                  ))}
                </RowFixed>
              </GreenBadge>
            ) : null}
            {amountAvailable > 0 && !open ? (
              <GreenBadge>
                <RowFixed style={{ flexWrap: 'nowrap' }}>
                  <Zap strokeWidth="3px" color={theme.green2} size="14px" />
                  <TYPE.body ml="4px" fontWeight={700} color={theme.green2} fontSize="12px">
                    <Trans>Boosts available</Trans>
                  </TYPE.body>
                  {incentives.map((incentive, i) => (
                    <CurrencyLogo
                      key={'incentive-logo-' + i}
                      size="20px"
                      style={{ marginLeft: '6px' }}
                      currency={incentive.initialRewardAmount.currency}
                    />
                  ))}
                </RowFixed>
              </GreenBadge>
            ) : null}
            <HoverText>
              {!open ? (
                <ChevronDown
                  size="28px"
                  color={theme.text3}
                  style={{ marginLeft: '4px' }}
                  onClick={() => setOpen(!open)}
                />
              ) : (
                <ChevronUp
                  size="28px"
                  color={theme.text3}
                  style={{ marginLeft: '4px' }}
                  onClick={() => setOpen(!open)}
                />
              )}
            </HoverText>
          </RowFixed>
        </HoverRow>
      ) : (
        <Loader />
      )}
      {open ? (
        incentivesLoading ? (
          <Loader />
        ) : !incentives || incentives.length === 0 ? (
          <TYPE.body>No boosts for this pool.</TYPE.body>
        ) : (
          <AutoColumn gap="24px" style={{ marginTop: '20px' }}>
            <Break />
            {isDeposited ? (
              <RowBetween>
                <AutoColumn gap="sm">
                  <TYPE.body fontSize="12px" color={theme.text3}>
                    <Trans>TOTAL UNCLAIMED REWARDS</Trans>
                  </TYPE.body>
                  <TYPE.body fontSize="36px" color={theme.green1} fontWeight={500}>
                    <Trans>${totalUnclaimedUSD}</Trans>
                  </TYPE.body>
                </AutoColumn>
                <AutoRow gap="8px" width="fit-content">
                  <ButtonSmall>
                    <Trans>Claim All</Trans>
                  </ButtonSmall>
                  <ButtonSmall>
                    <Trans>Unstake</Trans>
                  </ButtonSmall>
                </AutoRow>
              </RowBetween>
            ) : (
              <ButtonPrimary padding="12px" $borderRadius="12px">
                <RowFixed>
                  <Lock height="16px" style={{ marginRight: '4px' }} />
                  <Trans>Unlock & Join</Trans>
                </RowFixed>
              </ButtonPrimary>
            )}
            <DynamicSection disabled={!isDeposited}>
              <AutoColumn gap="16px">
                {incentives.map((incentive, i) => (
                  <BoostStatusRow key={'boost-status' + i} incentive={incentive} positionDetails={positionDetails} />
                ))}
              </AutoColumn>
            </DynamicSection>
            <ButtonLightGray as={Link} to={'/pool/' + positionDetails.tokenId}>
              <Trans>View position details →</Trans>
            </ButtonLightGray>
          </AutoColumn>
        )
      ) : null}
    </Wrapper>
  )
}
