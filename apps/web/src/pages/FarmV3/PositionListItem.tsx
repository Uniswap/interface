import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Price, Token } from '@ubeswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonGray, SmallButtonPrimary } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Loader from 'components/Icons/LoadingSpinner'
import { FlyoutAlignment, InternalMenuItem, MenuFlyout, StyledMenu } from 'components/Menu'
import { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { usePool } from 'hooks/usePools'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { Trans } from 'i18n'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Eye, LogOut, MoreVertical } from 'react-feather'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components'
import { MEDIA_WIDTHS } from 'theme'
import { HideSmall, SmallOnly, ThemedText } from 'theme/components'
import { useMedia } from 'ui'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'

import { DAI, USDC_MAINNET, USDT, WBTC, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

const DepositButton = styled(SmallButtonPrimary)`
  padding: 6px 12px;
`

const LinkRow = styled.div`
  align-items: center;
  display: flex;
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

const FeeTierText = styled(ThemedText.UtilityBadge)`
  font-size: 16px !important;
  margin-left: 8px !important;
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

const RangeDot = styled.span<{ inRange: boolean }>`
  background-color: ${({ theme, inRange }) => (inRange ? theme.success : theme.warning2)};
  border-radius: 50%;
  height: 8px;
  width: 8px;
`

const PrimaryPositionIdData = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  > * {
    margin-right: 8px;
  }
`

const PoolMenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 535;
`
const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  margin-right: 8px;
`
const StyledInternalMenuItem = styled(InternalMenuItem)`
  width: 100%;
`
const MenuWrapper = styled.div`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.neutral2};
  width: 100%;
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.neutral1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

interface PositionListItemProps {
  token0: string
  token1: string
  tokenId: BigNumber
  fee: number
  liquidity: BigNumber
  tickLower: number
  tickUpper: number
  isStaked: boolean
  onWithdraw: any
  onDeposit: any
}

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
  if (stables.some((stable) => stable.equals(token0))) {
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

export default function PositionListItem({
  token0: token0Address,
  token1: token1Address,
  tokenId,
  fee: feeAmount,
  liquidity,
  tickLower,
  tickUpper,
  isStaked,
  onWithdraw, // eslint-disable-line
  onDeposit, // eslint-disable-line
}: PositionListItemProps) {
  const { formatTickPrice, formatCurrencyAmount } = useFormatter()
  const media = useMedia()

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const position = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  // prices
  const { priceLower, priceUpper, quote, base } = getPriceOrderingFromPositionForUI(position)

  const currencyQuote = quote && unwrappedToken(quote)
  const currencyBase = base && unwrappedToken(base)

  const amountQuote = quote?.symbol == position?.amount0.currency.symbol ? position?.amount0 : position?.amount1
  const amountBase = base?.symbol == position?.amount0.currency.symbol ? position?.amount0 : position?.amount1

  const price0 = useStablecoinPrice(token0 ?? undefined)
  const price1 = useStablecoinPrice(token1 ?? undefined)

  const fiatValueOfLiquidity: CurrencyAmount<Token> | null = useMemo(() => {
    if (!price0 || !price1 || !position) return null
    const amount0 = price0.quote(position.amount0)
    const amount1 = price1.quote(position.amount1)
    return amount0.add(amount1)
  }, [price0, price1, position])

  // check if price is within range
  const outOfRange: boolean = pool ? pool.tickCurrent < tickLower || pool.tickCurrent >= tickUpper : false

  // const positionSummaryLink = '/pools/' + tokenId

  const removed = liquidity?.eq(0)

  const node = useRef<HTMLDivElement>()
  const [isMenuOpened, setIsMenuOpened] = useState(false)
  const toggleMenu = useCallback(() => {
    setIsMenuOpened((curr) => !curr)
  }, [setIsMenuOpened])
  useOnClickOutside(node, isMenuOpened ? toggleMenu : undefined)

  return (
    <LinkRow>
      <RowBetween>
        <PrimaryPositionIdData>
          <DoubleCurrencyLogo currency0={currencyBase} currency1={currencyQuote} size={18} margin />
          <ThemedText.SubHeader>
            {formatCurrencyAmount({
              amount: amountQuote,
              type: NumberType.TokenNonTx,
              placeholder: '',
            })}
            &nbsp;
            {currencyQuote?.symbol}
            &nbsp;/&nbsp;
            {formatCurrencyAmount({
              amount: amountBase,
              type: NumberType.TokenNonTx,
              placeholder: '',
            })}
            &nbsp;
            {currencyBase?.symbol}
          </ThemedText.SubHeader>

          {!media.md && (
            <FeeTierText>
              =&nbsp;
              {formatCurrencyAmount({
                amount: fiatValueOfLiquidity,
                type: NumberType.FiatTokenPrice,
              })}
            </FeeTierText>
          )}

          <div style={{ width: '8px' }}></div>
          {media.md ? <RangeDot inRange={!outOfRange} /> : <RangeBadge removed={removed} inRange={!outOfRange} />}
        </PrimaryPositionIdData>

        {isStaked ? (
          <StyledMenu ref={node as any}>
            <MoreOptionsButton onClick={toggleMenu}>
              <MoreVertical size={15} />
            </MoreOptionsButton>
            {isMenuOpened && (
              <MenuFlyout flyoutAlignment={FlyoutAlignment.RIGHT}>
                <StyledInternalMenuItem to={'/pools/' + tokenId.toString() + '?from_farm=true'}>
                  <PoolMenuItem>
                    <Trans>See Details</Trans>
                    <Eye size={15} />
                  </PoolMenuItem>
                </StyledInternalMenuItem>
                <MenuWrapper>
                  <PoolMenuItem onClick={() => onWithdraw(tokenId)}>
                    <Trans>Withdraw</Trans>
                    <LogOut size={15} />
                  </PoolMenuItem>
                </MenuWrapper>
              </MenuFlyout>
            )}
          </StyledMenu>
        ) : (
          <DepositButton onClick={() => onDeposit(tokenId)}>
            <Trans>Deposit</Trans>
          </DepositButton>
        )}
      </RowBetween>

      {priceLower && priceUpper ? (
        <RangeLineItem>
          <RangeText>
            <ExtentsText>
              <Trans>Min: </Trans>
            </ExtentsText>
            <span>
              {formatTickPrice({
                price: priceLower,
                atLimit: tickAtLimit,
                direction: Bound.LOWER,
              })}{' '}
            </span>
            <Trans>
              <HoverInlineText text={currencyQuote?.symbol} /> per <HoverInlineText text={currencyBase?.symbol ?? ''} />
            </Trans>
          </RangeText>{' '}
          <HideSmall>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </HideSmall>
          <SmallOnly>
            <DoubleArrow>↔</DoubleArrow>{' '}
          </SmallOnly>
          <RangeText>
            <ExtentsText>
              <Trans>Max:</Trans>
            </ExtentsText>
            <span>
              {formatTickPrice({
                price: priceUpper,
                atLimit: tickAtLimit,
                direction: Bound.UPPER,
              })}{' '}
            </span>
            <Trans>
              <HoverInlineText text={currencyQuote?.symbol} /> per{' '}
              <HoverInlineText maxCharacters={10} text={currencyBase?.symbol} />
            </Trans>
          </RangeText>
        </RangeLineItem>
      ) : (
        <Loader />
      )}
    </LinkRow>
  )
}
