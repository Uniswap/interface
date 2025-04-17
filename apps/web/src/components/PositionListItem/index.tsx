import { BigNumber } from '@ethersproject/bignumber'
import { Percent, Price, Token } from '@taraswap/sdk-core'
import { Position } from '@taraswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Icons/LoadingSpinner'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { usePool } from 'hooks/usePools'
import { Trans } from 'i18n'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { HideSmall, SmallOnly, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DoubleCurrencyLogo } from 'components/DoubleLogo'
import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

const LinkRow = styled(Link)`
  align-items: center;
  display: flex;
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.neutral1};
  padding: 16px;
  text-decoration: none;
  font-weight: 535;

  & > div:not(:first-child) {
    text-align: center;
  }
  :hover {
    background-color: ${({ theme }) => theme.deprecated_hoverDefault};
  }

  @media screen and (min-width: ${MEDIA_WIDTHS.deprecated_upToSmall}px) {
    /* flex-direction: row; */
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    row-gap: 8px;
  `};
`

const DataLineItem = styled.div`
  font-size: 14px;
`

const RangeLineItem = styled(DataLineItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  width: 100%;
`

const DoubleArrow = styled.span`
  font-size: 12px;
  margin: 0 2px;
  color: ${({ theme }) => theme.neutral1};
`

const RangeText = styled(ThemedText.BodySmall)`
  font-size: 14px !important;
  word-break: break-word;
  padding: 0.25rem 0.25rem;
  border-radius: 8px;
`

const FeeTierText = styled(ThemedText.BodyPrimary)`
  margin-left: 8px !important;
  line-height: 12px;
  color: ${({ theme }) => theme.neutral3};
`

const ExtentsText = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.neutral2};
  display: inline-block;
  line-height: 16px;
  margin-right: 4px !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

interface BasePositionListItemProps {
  isStakingPosition?: boolean
}

interface StakingPositionListItemProps extends BasePositionListItemProps {
  isStakingPosition: true
  id: string
  minter: { id: string }
  owner: { id: string }
  pool: {
    id: string
    feeTier: number
    token0: { symbol: string }
    token1: { symbol: string }
  }
  tickLower: { tickIdx: string }
  tickUpper: { tickIdx: string }
}

interface RegularPositionListItemProps extends BasePositionListItemProps {
  isStakingPosition?: false
  token0: string
  token1: string
  tokenId: BigNumber
  fee: number
  liquidity: BigNumber
  tickLower: number
  tickUpper: number
}

type PositionListItemProps = StakingPositionListItemProps | RegularPositionListItemProps

export function getPriceOrderingFromPositionForUI(position?: Position): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} {
  if (!position) {
    return {}
  }

  const token0 = position.amount0.currency
  const token1 = position.amount1.currency

  // if token0 is a dollar-stable asset, set it as the quote token
  const stables = [DAI, USDC_MAINNET, USDT]
  if (stables.some((stable) => stable?.equals(token0))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if token1 is an ETH-/BTC-stable asset, set it as the base token
  const bases = [...Object.values(WRAPPED_NATIVE_CURRENCY), WBTC]
  if (bases.some((base) => base && base.equals(token1))) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // if both prices are below 1, invert
  if (position.token0PriceUpper.lessThan(1)) {
    return {
      priceLower: position.token0PriceUpper.invert(),
      priceUpper: position.token0PriceLower.invert(),
      quote: token0,
      base: token1,
    }
  }

  // otherwise, just return the default
  return {
    priceLower: position.token0PriceLower,
    priceUpper: position.token0PriceUpper,
    quote: token1,
    base: token0,
  }
}

export default function PositionListItem(props: PositionListItemProps) {
  const { formatDelta, formatTickPrice } = useFormatter()

  if (props.isStakingPosition) {
    const {
      id,
      pool,
      tickLower,
      tickUpper
    } = props

    if (!pool) return null

    const positionSummaryLink = `/pool/${id}`

    return (
      <LinkRow to={positionSummaryLink}>
        <RowBetween>
          <PrimaryPositionIdData>
            <ThemedText.SubHeader>
              {pool.token0.symbol} / {pool.token1.symbol}
            </ThemedText.SubHeader>
            <FeeTierText>{formatDelta(parseFloat(new Percent(pool.feeTier, 1_000_000).toSignificant()))}</FeeTierText>
          </PrimaryPositionIdData>
          <RangeBadge removed={false} inRange={true} />
        </RowBetween>

        <RangeLineItem>
          <RangeText>
            <ExtentsText>
              <Trans i18nKey="pool.min.label" />
              &nbsp;
            </ExtentsText>
            <span>{tickLower.tickIdx}</span>
            <Trans
              i18nKey="common.xPerY"
              components={{
                x: <HoverInlineText text={pool.token0.symbol} />,
                y: <HoverInlineText text={pool.token1.symbol} />,
              }}
            />
          </RangeText>
          <HideSmall>
            <DoubleArrow>↔</DoubleArrow>
          </HideSmall>
          <SmallOnly>
            <DoubleArrow>↔</DoubleArrow>
          </SmallOnly>
          <RangeText>
            <ExtentsText>
              <Trans i18nKey="pool.max.label" />
              &nbsp;
            </ExtentsText>
            <span>{tickUpper.tickIdx}</span>
            <Trans
              i18nKey="common.xPerY"
              components={{
                x: <HoverInlineText text={pool.token0.symbol} />,
                y: <HoverInlineText text={pool.token1.symbol} />,
              }}
            />
          </RangeText>
        </RangeLineItem>
      </LinkRow>
    )
  }

  const {
    token0: token0Address,
    token1: token1Address,
    tokenId,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
  } = props

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool && liquidity && tickLower !== undefined && tickUpper !== undefined) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)

  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  // check if price is within range
  const outOfRange: boolean = pool && tickLower !== undefined && tickUpper !== undefined 
    ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper 
    : false

  const positionSummaryLink = '/pools/' + tokenId

  const removed = liquidity?.eq(0)

  return (
    <LinkRow to={positionSummaryLink}>
      <RowBetween>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currencies={[currencyBase, currencyQuote]} size={18} />
          <ThemedText.SubHeader>
            &nbsp;{currencyQuote?.symbol}&nbsp;/&nbsp;{currencyBase?.symbol}
          </ThemedText.SubHeader>

          <FeeTierText>{feeAmount ? formatDelta(parseFloat(new Percent(feeAmount, 1_000_000).toSignificant())) : null}</FeeTierText>
        </PrimaryPositionIdData>
        <RangeBadge removed={removed} inRange={!outOfRange} />
      </RowBetween>

      {priceLower && priceUpper ? (
        <RangeLineItem>
          <RangeText>
            <ExtentsText>
              <Trans i18nKey="pool.min.label" />
              &nbsp;
            </ExtentsText>
            <span>
              {formatTickPrice({
                price: priceLower,
                atLimit: tickAtLimit,
                direction: Bound.LOWER,
              })}{' '}
            </span>
            <Trans
              i18nKey="common.xPerY"
              components={{
                x: <HoverInlineText text={currencyQuote?.symbol} />,
                y: <HoverInlineText text={currencyBase?.symbol ?? ''} />,
              }}
            />
          </RangeText>{' '}
          <HideSmall>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </HideSmall>
          <SmallOnly>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </SmallOnly>
          <RangeText>
            <ExtentsText>
              <Trans i18nKey="pool.max.label" />
              &nbsp;
            </ExtentsText>
            <span>
              {formatTickPrice({
                price: priceUpper,
                atLimit: tickAtLimit,
                direction: Bound.UPPER,
              })}{' '}
            </span>
            <Trans
              i18nKey="common.xPerY"
              components={{
                x: <HoverInlineText text={currencyQuote?.symbol} />,
                y: <HoverInlineText text={currencyBase?.symbol ?? ''} />,
              }}
            />
          </RangeText>
        </RangeLineItem>
      ) : (
        <Loader />
      )}
    </LinkRow>
  )
}
