import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'

const Dot = styled.div<{ isShow?: boolean | undefined; isCurrentPrice?: boolean; outOfRange?: boolean }>`
  width: 8px;
  min-width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, outOfRange, isCurrentPrice, isShow: show }) =>
    !show ? 'transparent' : isCurrentPrice ? theme.text : outOfRange ? theme.warning : theme.primary};
  margin-left: -4px;
  margin-right: -4px;
  z-index: ${({ isCurrentPrice }) => (isCurrentPrice ? 3 : 2)};
`

const PriceVisualizeWrapper = styled.div<{ center?: boolean }>`
  ${({ center }) =>
    center
      ? ''
      : css`
          margin-top: 12px;
        `}
  height: 2px;
  background: ${({ theme }) => theme.border};
  align-items: center;
  display: flex;
  width: 100%;
`

const Line = styled(Flex)`
  height: 2px;
  background-color: ${({ theme }) => theme.border};
`

const PriceVisualize = ({
  priceLower: priceLowerProp,
  priceUpper: priceUpperProp,
  price,
  ticksAtLimit,
  center,
}: {
  priceLower: Price<Currency, Currency>
  priceUpper: Price<Currency, Currency>
  price: Price<Currency, Currency>
  ticksAtLimit?: {
    [bound in Bound]: boolean | undefined
  }
  center?: boolean
}) => {
  const theme = useTheme()
  const [showTooltip, setShowTooltip] = useState(false)
  const onFocus = useCallback(() => {
    setShowTooltip(true)
  }, [])

  const onLeave = useCallback(() => {
    setShowTooltip(false)
  }, [])

  const reverted = !priceLowerProp.baseCurrency.wrapped.sortsBefore(priceLowerProp.quoteCurrency.wrapped)

  const [priceLower, priceUpper] = reverted ? [priceUpperProp, priceLowerProp] : [priceLowerProp, priceUpperProp]
  const outOfRange = price.lessThan(priceLower) || price.greaterThan(priceUpper)

  const ticksAtLimitFormatted = reverted
    ? {
        [Bound.LOWER]: ticksAtLimit?.[Bound.UPPER],
        [Bound.UPPER]: ticksAtLimit?.[Bound.LOWER],
      }
    : ticksAtLimit
  const formattedLowerPrice = formatTickPrice(priceLower, ticksAtLimitFormatted, Bound.LOWER)
  const formattedUpperPrice = formatTickPrice(priceUpper, ticksAtLimitFormatted, Bound.UPPER)

  const deltaRelative =
    Math.log(parseFloat(price.asFraction.divide(priceLower.asFraction).toSignificant(18))) /
    Math.log(parseFloat(priceUpper.asFraction.divide(price.asFraction).toSignificant(18)))

  const [is0, isInfinity] = reverted
    ? [ticksAtLimit?.[Bound.UPPER], ticksAtLimit?.[Bound.LOWER]]
    : [ticksAtLimit?.[Bound.LOWER], ticksAtLimit?.[Bound.UPPER]]

  const {
    a,
    b,
    c,
    d,
    e,
    f,
    p1,
    p2,
    p3,
    p4,
  }: {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number
    p1: boolean
    p2: boolean
    p3: boolean
    p4: boolean
  } = useMemo(() => {
    const padding = 15
    const spaceLeft = 50 - padding
    let a: number, b: number, c: number, d: number, e: number, f: number
    let p1: boolean, p2: boolean, p3: boolean, p4: boolean
    // ------ p1 -------- p2 -------- pCurrent -------- p3 -------- p4 ------
    //    a         b            c        |        d           e          f

    if (is0 && isInfinity) {
      a = f = b = e = 0
      c = d = 50
      p1 = p2 = p3 = p4 = false
      return { a, b, c, d, e, f, p1, p2, p3, p4 }
    }
    if (is0) {
      a = 0
      if (priceUpper.lessThan(price)) {
        c = 20
        b = 30
        p2 = true
        p3 = false
      } else {
        b = 0
        c = 50
        p2 = false
        p3 = true
      }
      p1 = p4 = false
      d = spaceLeft
      e = 0
      f = padding
      return { a, b, c, d, e, f, p1, p2, p3, p4 }
    }
    if (isInfinity) {
      f = 0
      if (price.lessThan(priceLower)) {
        d = 20
        e = 30
        p3 = true
        p2 = false
      } else {
        e = 0
        d = 50
        p3 = false
        p2 = true
      }
      p1 = p4 = false
      c = spaceLeft
      b = 0
      a = padding
      return { a, b, c, d, e, f, p1, p2, p3, p4 }
    }

    a = padding
    f = padding
    if (outOfRange) {
      if (price.lessThan(priceLower)) {
        p3 = p4 = true
        p1 = p2 = false
        b = 0
        c = spaceLeft
        const eN = spaceLeft / (-deltaRelative + 1)
        e = eN
        d = -eN * deltaRelative
      } else {
        // price.greaterThan(priceUpper)
        p3 = p4 = false
        p1 = p2 = true

        e = 0
        d = spaceLeft
        const bN = spaceLeft / (-deltaRelative + 1)
        c = bN
        b = -bN * deltaRelative
      }
    } else {
      p2 = p3 = true
      p1 = p4 = false
      if (deltaRelative > 1) {
        // => c > d
        b = 0
        c = spaceLeft
        const dN: number = spaceLeft / deltaRelative
        d = dN
        e = spaceLeft - dN
      } else {
        //=> c < d
        e = 0
        d = spaceLeft
        const cN: number = spaceLeft * deltaRelative
        c = cN
        b = spaceLeft - cN
      }
    }
    return { a, b, c, d, e, f, p1, p2, p3, p4 }
  }, [deltaRelative, is0, isInfinity, outOfRange, price, priceLower, priceUpper])

  return (
    <PriceVisualizeWrapper onMouseEnter={onFocus} onMouseLeave={onLeave} center={center}>
      <Line width={a + '%'} backgroundColor={is0 ? (outOfRange ? theme.warning : theme.primary) : theme.border} />
      <Dot isShow={p1} outOfRange={outOfRange} />
      <Line height="2px" width={b.toFixed(4) + '%'} backgroundColor={outOfRange ? theme.warning : theme.border} />
      <Dot isShow={p2} outOfRange={outOfRange} />
      <Line height="2px" width={c.toFixed(4) + '%'} backgroundColor={outOfRange ? theme.border : theme.primary} />
      <Dot isShow isCurrentPrice outOfRange={outOfRange}>
        <Tooltip
          text={
            <Text>
              {formattedLowerPrice} <DoubleArrow /> {formattedUpperPrice}
            </Text>
          }
          containerStyle={{ width: '100%' }}
          style={{ minWidth: '70px' }}
          width="fit-content"
          show={showTooltip}
          placement="top"
          offset={[8, 30]}
        />
      </Dot>
      <Line height="2px" width={d.toFixed(4) + '%'} backgroundColor={outOfRange ? theme.border : theme.primary} />
      <Dot isShow={p3} outOfRange={outOfRange} />
      <Line height="2px" width={e.toFixed(4) + '%'} backgroundColor={outOfRange ? theme.warning : theme.border} />
      <Dot isShow={p4} outOfRange={outOfRange} />
      <Line
        width={f + '%'}
        backgroundColor={isInfinity ? (outOfRange ? theme.warning : theme.primary) : theme.border}
      />
    </PriceVisualizeWrapper>
  )
}

export default PriceVisualize
