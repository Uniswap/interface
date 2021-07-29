import { Trans } from '@lingui/macro'
import { Pool, Position } from '@uniswap/v3-sdk'
import { GreenBadge } from 'components/Badge'
import RangeBadge from 'components/Badge/RangeBadge'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Loader'
import { getPriceOrderingFromPositionForUI } from 'components/PositionListItem'
import { RowBetween, RowFixed } from 'components/Row'
import { BigNumber } from 'ethers'
import { useIncentivesForPool } from 'hooks/incentives/useAllIncentives'
import { DepositedTokenIdsState, useDepositedTokenIds } from 'hooks/incentives/useDepositedTokenIds'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'react-feather'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'
import { HideSmall, HoverText, SmallOnly, TYPE } from 'theme'
import { PositionDetails } from 'types/position'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Break } from './styled'

const Wrapper = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.bg3};
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
  /* background-color: ${({ theme }) => theme.bg2}; */
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
`

const ExtentsText = styled.span`
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
  margin-right: 4px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
  `};
`

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
  const { incentives } = useIncentivesForPool(poolAddress)

  // toggle open state
  const [open, setOpen] = useState(false)

  // amount of programs where position is staked
  const amountBoosted = incentives
    ? incentives.reduce((accum, incentive) => {
        /**
         * @TODO get data about which positions are staked
         */
        console.log(incentive)
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

  console.log(isDeposited)

  return (
    <Wrapper>
      {priceLower && priceUpper && incentives ? (
        <RowBetween>
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
        </RowBetween>
      ) : (
        <Loader />
      )}
      {open ? (
        <AutoColumn gap="24px" style={{ marginTop: '20px' }}>
          <Break />
        </AutoColumn>
      ) : null}
    </Wrapper>
  )
}
