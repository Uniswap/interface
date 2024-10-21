// eslint-disable-next-line no-restricted-imports
import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Price, Token } from '@uniswap/sdk-core'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { useMemo, useState } from 'react'
import { Bound } from 'state/mint/v3/actions'
import { Flex, SegmentedControl, SegmentedControlOption, Text, styled } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const InnerTile = styled(Flex, {
  grow: true,
  alignItems: 'center',
  gap: '$gap8',
  borderRadius: '$rounded12',
  backgroundColor: '$surface3',
  p: '$padding16',
})

interface LiquidityPositionPriceRangeTileProps {
  status?: PositionStatus
  priceOrdering: {
    priceLower?: Price<Token, Token>
    priceUpper?: Price<Token, Token>
    quote?: Token
    base?: Token
  }
  isTickAtLimit: {
    [Bound.LOWER]?: boolean
    [Bound.UPPER]?: boolean
  }
  token0CurrentPrice: Price<Token, Token>
  token1CurrentPrice: Price<Token, Token>
}

const getValues = ({
  token0CurrentPrice,
  token1CurrentPrice,
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  token0CurrentPrice?: Price<Token, Token>
  token1CurrentPrice?: Price<Token, Token>
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  currentPrice?: Price<Token, Token>
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    currentPrice: invert ? token1CurrentPrice : token0CurrentPrice,
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

export function LiquidityPositionPriceRangeTile({
  status,
  priceOrdering,
  isTickAtLimit,
  token0CurrentPrice,
  token1CurrentPrice,
}: LiquidityPositionPriceRangeTileProps) {
  const { formatTickPrice, formatPrice } = useFormatter()
  const [pricesInverted, setPricesInverted] = useState(false)

  const currencyASymbol = token0CurrentPrice.baseCurrency.symbol
  const currencyBSymbol = token0CurrentPrice.quoteCurrency.symbol

  const controlOptions: SegmentedControlOption[] = useMemo(() => {
    return [
      {
        value: currencyASymbol ?? '',
        display: <Text variant="buttonLabel3">{currencyASymbol}</Text>,
      },
      {
        value: currencyBSymbol ?? '',
        display: <Text variant="buttonLabel3">{currencyBSymbol}</Text>,
      },
    ]
  }, [currencyASymbol, currencyBSymbol])

  if (!currencyASymbol || !currencyBSymbol) {
    throw new Error('LiquidityPositionPriceRangeTile: Currency symbols are required')
  }

  const {
    currentPrice: displayCurrentPrice,
    priceLower,
    priceUpper,
    base,
    quote,
  } = getValues({
    token0CurrentPrice,
    token1CurrentPrice,
    ...priceOrdering,
    invert: pricesInverted,
  })

  const displayMinPrice = formatTickPrice({
    price: priceLower,
    atLimit: isTickAtLimit,
    direction: Bound.LOWER,
    numberType: NumberType.TokenTx,
  })
  const displayMaxPrice = formatTickPrice({
    price: priceUpper,
    atLimit: isTickAtLimit,
    direction: Bound.UPPER,
    numberType: NumberType.TokenTx,
  })
  const displayASymbol = quote?.symbol
  const displayBSymbol = base?.symbol

  return (
    <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" width="100%" gap="$gap12">
      <Flex row width="100%" justifyContent="space-between" alignItems="center">
        <Flex row alignItems="center" gap="$gap12">
          <Text variant="subheading1">
            <Trans i18nKey="pool.priceRange" />
          </Text>
          {status && <LiquidityPositionStatusIndicator status={status} />}
        </Flex>
        <SegmentedControl
          options={controlOptions}
          selectedOption={pricesInverted ? currencyBSymbol : currencyASymbol}
          onSelectOption={(selected) => {
            setPricesInverted(selected !== currencyASymbol)
          }}
        />
      </Flex>
      <Flex row width="100%" gap="$gap12">
        <InnerTile>
          <Text variant="subheading2" color="$neutral2">
            <Trans i18nKey="pool.minPrice" />
          </Text>
          <Text variant="heading2" color="$neutral1">
            {displayMinPrice}
          </Text>
          <Text variant="subheading2" color="$neutral2">
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{
                symbolA: displayASymbol,
                symbolB: displayBSymbol,
              }}
            />
          </Text>
        </InnerTile>
        <InnerTile>
          <Text variant="subheading2" color="$neutral2">
            <Trans i18nKey="pool.maxPrice" />
          </Text>
          <Text variant="heading2" color="$neutral1">
            {displayMaxPrice}
          </Text>
          <Text variant="subheading2" color="$neutral2">
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{
                symbolA: displayASymbol,
                symbolB: displayBSymbol,
              }}
            />
          </Text>
        </InnerTile>
      </Flex>
      <InnerTile>
        <Text variant="subheading2" color="$neutral2">
          <Trans i18nKey="common.currentPrice" />
        </Text>
        <Text variant="heading2" color="$neutral1">
          {formatPrice({ price: displayCurrentPrice, type: NumberType.TokenTx })}
        </Text>
        <Text variant="subheading2" color="$neutral2">
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: displayASymbol,
              symbolB: displayBSymbol,
            }}
          />
        </Text>
      </InnerTile>
    </Flex>
  )
}
