// eslint-disable-next-line no-restricted-imports
import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { useMemo, useState } from 'react'
import { Flex, SegmentedControl, SegmentedControlOption, Text, styled } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'

const InnerTile = styled(Flex, {
  grow: true,
  alignItems: 'center',
  gap: '$gap8',
  borderRadius: '$rounded12',
  backgroundColor: '$surface3',
  p: '$padding16',
})

interface LiquidityPositionPriceRangeTileProps {
  status: PositionStatus
  minPrice: Price<Currency, Currency>
  maxPrice: Price<Currency, Currency>
  currentPrice: Price<Currency, Currency>
}

export function LiquidityPositionPriceRangeTile({
  status,
  minPrice,
  maxPrice,
  currentPrice,
}: LiquidityPositionPriceRangeTileProps) {
  const [pricesInverted, setPricesInverted] = useState(false)
  const currencyASymbol = currentPrice.baseCurrency.symbol
  const currencyBSymbol = currentPrice.quoteCurrency.symbol

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

  const displayMinPrice = pricesInverted ? minPrice.invert() : minPrice
  const displayMaxPrice = pricesInverted ? maxPrice.invert() : maxPrice
  const displayCurrentPrice = pricesInverted ? currentPrice.invert() : currentPrice
  const displayASymbol = pricesInverted ? currencyBSymbol : currencyASymbol
  const displayBSymbol = pricesInverted ? currencyASymbol : currencyBSymbol

  return (
    <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" width="100%" gap="$gap12">
      <Flex row width="100%" justifyContent="space-between" alignItems="center">
        <Flex row alignItems="center" gap="$gap12">
          <Text variant="subheading1">
            <Trans i18nKey="pool.priceRange" />
          </Text>
          <LiquidityPositionStatusIndicator status={status} />
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
            {displayMinPrice.toFixed()}
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
            {displayMaxPrice.toFixed()}
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
          {displayCurrentPrice.toFixed()}
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
