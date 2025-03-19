import { Currency, Price } from '@uniswap/sdk-core'
import { useGetRangeDisplay } from 'components/Liquidity/hooks'
import { PriceOrdering } from 'components/Liquidity/types'
import { useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, SegmentedControl, SegmentedControlOption, Text, styled } from 'ui/src'
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
  token1: Currency
  priceOrdering: PriceOrdering
  token0CurrentPrice: Price<Currency, Currency>
  token1CurrentPrice: Price<Currency, Currency>
  tickSpacing?: number
  tickLower?: string
  tickUpper?: string
}

export function LiquidityPositionPriceRangeTile({
  token1,
  priceOrdering,
  token0CurrentPrice,
  token1CurrentPrice,
  tickSpacing,
  tickLower,
  tickUpper,
}: LiquidityPositionPriceRangeTileProps) {
  const { formatPrice } = useFormatter()
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

  const { minPrice, maxPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  const currentPrice = useMemo(() => {
    const { base } = priceOrdering
    if (!base) {
      return undefined
    }

    if (!pricesInverted) {
      return base?.equals(token1) ? token1CurrentPrice : token0CurrentPrice
    }

    return base?.equals(token1) ? token0CurrentPrice : token1CurrentPrice
  }, [priceOrdering, token0CurrentPrice, token1CurrentPrice, token1, pricesInverted])

  return (
    <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" width="100%" gap="$gap12">
      <Flex row width="100%" justifyContent="space-between" alignItems="center">
        <Flex row alignItems="center" gap="$gap12">
          <Text variant="subheading1">
            <Trans i18nKey="pool.priceRange" />
          </Text>
        </Flex>
        <SegmentedControl
          size="large"
          options={controlOptions}
          selectedOption={pricesInverted ? currencyBSymbol : currencyASymbol}
          onSelectOption={(selected) => {
            setPricesInverted(selected !== currencyASymbol)
          }}
        />
      </Flex>
      <Flex row width="100%" gap="$gap12" $lg={{ row: false }}>
        <InnerTile>
          <Text variant="subheading2" color="$neutral2">
            <Trans i18nKey="pool.minPrice" />
          </Text>
          <Text variant="heading2" color="$neutral1">
            {minPrice}
          </Text>
          <Text variant="subheading2" color="$neutral2">
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{
                symbolA: tokenASymbol,
                symbolB: tokenBSymbol,
              }}
            />
          </Text>
        </InnerTile>
        <InnerTile>
          <Text variant="subheading2" color="$neutral2">
            <Trans i18nKey="pool.maxPrice" />
          </Text>
          <Text variant="heading2" color="$neutral1">
            {maxPrice}
          </Text>
          <Text variant="subheading2" color="$neutral2">
            <Trans
              i18nKey="common.feesEarnedPerBase"
              values={{
                symbolA: tokenASymbol,
                symbolB: tokenBSymbol,
              }}
            />
          </Text>
        </InnerTile>
      </Flex>
      <InnerTile>
        <Text variant="subheading2" color="$neutral2">
          <Trans i18nKey="common.marketPrice" />
        </Text>
        <Text variant="heading2" color="$neutral1">
          {formatPrice({ price: currentPrice, type: NumberType.TokenTx })}
        </Text>
        <Text variant="subheading2" color="$neutral2">
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: tokenASymbol,
              symbolB: tokenBSymbol,
            }}
          />
        </Text>
      </InnerTile>
    </Flex>
  )
}
