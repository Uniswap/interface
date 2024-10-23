// eslint-disable-next-line no-restricted-imports
import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { LiquidityPositionStatusIndicator } from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { useGetRangeDisplay } from 'components/Liquidity/utils'
import { PriceOrdering } from 'components/PositionListItem'
import { useMemo, useState } from 'react'
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
  priceOrdering: PriceOrdering
  token0CurrentPrice: Price<Currency, Currency>
  token1CurrentPrice: Price<Currency, Currency>
  feeTier?: string
  tickLower?: string
  tickUpper?: string
}

export function LiquidityPositionPriceRangeTile({
  status,
  priceOrdering,
  token0CurrentPrice,
  token1CurrentPrice,
  feeTier,
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

  const { minPrice, maxPrice, currentPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    token0CurrentPrice,
    token1CurrentPrice,
    priceOrdering,
    feeTier,
    tickLower,
    tickUpper,
    pricesInverted,
  })

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
          <Trans i18nKey="common.currentPrice" />
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
