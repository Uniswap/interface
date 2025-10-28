import { Currency, Price } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BaseQuoteFiatAmount } from 'components/Liquidity/BaseQuoteFiatAmount'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

export function DisplayCurrentPrice({ price, isLoading }: { price?: Price<Currency, Currency>; isLoading?: boolean }) {
  const isD3LiquidityRangeChartEnabled = useFeatureFlag(FeatureFlags.D3LiquidityRangeChart)

  if (isD3LiquidityRangeChartEnabled) {
    return (
      <Flex gap="$gap4" row alignItems="center" $md={{ row: false, alignItems: 'flex-start' }}>
        {isLoading ? (
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.marketPrice.fetching" />
          </Text>
        ) : price ? (
          <Flex>
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.currentPrice" />
            </Text>
            <BaseQuoteFiatAmount
              variant="subheading1"
              condenseConversion
              price={price}
              base={price.baseCurrency}
              quote={price.quoteCurrency}
            />
          </Flex>
        ) : (
          <Flex row alignItems="center" gap="$spacing4">
            <AlertTriangleFilled size={16} color="$neutral2" />
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.marketPrice.unavailable" />
            </Text>
          </Flex>
        )}
      </Flex>
    )
  }

  return (
    <Flex gap="$gap4" row alignItems="center" $md={{ row: false, alignItems: 'flex-start' }}>
      {isLoading ? (
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="common.marketPrice.fetching" />
        </Text>
      ) : price ? (
        <>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.marketPrice.label" />
          </Text>
          <BaseQuoteFiatAmount price={price} base={price.baseCurrency} quote={price.quoteCurrency} />
        </>
      ) : (
        <Flex row alignItems="center" gap="$spacing4">
          <AlertTriangleFilled size={16} color="$neutral2" />
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.marketPrice.unavailable" />
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
