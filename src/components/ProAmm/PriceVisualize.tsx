import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DoubleArrow } from 'assets/svg/double_arrow.svg'
import Tooltip from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/type'
import { formatTickPrice } from 'utils/formatTickPrice'

const Dot = styled.div<{ isCurrentPrice?: boolean; outOfRange?: boolean }>`
  width: 8px;
  min-width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, outOfRange, isCurrentPrice }) =>
    isCurrentPrice ? theme.text : outOfRange ? theme.warning : theme.primary};
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

const PriceVisualize = ({
  priceLower: priceLowerProp,
  priceUpper: priceUpperProp,
  price,
  showTooltip,
  ticksAtLimit,
  center,
}: {
  priceLower: Price<Currency, Currency>
  priceUpper: Price<Currency, Currency>
  price: Price<Currency, Currency>
  showTooltip?: boolean
  ticksAtLimit?: {
    [bound in Bound]: boolean | undefined
  }
  center?: boolean
}) => {
  const theme = useTheme()
  const reverted = priceUpperProp.lessThan(priceLowerProp)

  const [priceLower, priceUpper] = reverted ? [priceUpperProp, priceLowerProp] : [priceLowerProp, priceUpperProp]
  const outOfRange = price.lessThan(priceLower) || price.greaterThan(priceUpper)

  const minPrice = priceLower.lessThan(price) ? priceLower : price
  const maxPrice = priceUpper.greaterThan(price) ? priceUpper : price
  const middlePrice = priceLower.lessThan(price) ? (priceUpper.greaterThan(price) ? price : priceUpper) : priceLower

  const deltaRelative =
    Math.log(parseFloat(middlePrice.asFraction.divide(minPrice.asFraction).toSignificant(18))) /
    Math.log(parseFloat(maxPrice.asFraction.divide(middlePrice.asFraction).toSignificant(18)))

  const delta = deltaRelative / (deltaRelative + 1)

  const formattedLowerPrice = formatTickPrice(priceLower, ticksAtLimit, Bound.LOWER)
  const formattedUpperPrice = formatTickPrice(priceUpper, ticksAtLimit, Bound.UPPER)

  const [show, setShow] = useState(false)

  const onFocus = useCallback(() => {
    setShow(true)
  }, [])

  const onLeave = useCallback(() => {
    setShow(false)
  }, [])

  return (
    <PriceVisualizeWrapper onMouseEnter={onFocus} onMouseLeave={onLeave} center={center}>
      <Flex width="20%" />
      <Dot isCurrentPrice={minPrice.equalTo(price)} outOfRange={outOfRange} />
      <Flex
        height="2px"
        width={(delta * 60).toString() + '%'}
        backgroundColor={
          middlePrice.equalTo(priceUpper) ? theme.warning : middlePrice.equalTo(price) ? theme.primary : theme.border
        }
      />
      <Dot isCurrentPrice={middlePrice.equalTo(price)} outOfRange={outOfRange}>
        {showTooltip && (
          <Tooltip
            text={
              <Text>
                {formattedLowerPrice} <DoubleArrow /> {formattedUpperPrice}
              </Text>
            }
            containerStyle={{ width: '100%' }}
            style={{ minWidth: '70px' }}
            width="fit-content"
            show={show}
            placement="top"
            offset={[8, 30]}
          />
        )}
      </Dot>
      <Flex
        height="2px"
        flex={1}
        backgroundColor={
          middlePrice.equalTo(priceLower) ? theme.warning : middlePrice.equalTo(price) ? theme.primary : theme.border
        }
      />
      <Dot isCurrentPrice={maxPrice.equalTo(price)} outOfRange={outOfRange} />
      <Flex width="20%" />
    </PriceVisualizeWrapper>
  )
}

export default PriceVisualize
