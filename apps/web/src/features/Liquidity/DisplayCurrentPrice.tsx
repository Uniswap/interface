import { Currency, Price } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useTranslation } from 'react-i18next'
import { BaseQuoteFiatAmount } from '~/features/Liquidity/BaseQuoteFiatAmount'

export function DisplayCurrentPrice({ price, isLoading }: { price?: Price<Currency, Currency>; isLoading?: boolean }) {
  const { t } = useTranslation()
  return (
    <Flex
      gap="$gap4"
      row
      alignItems="center"
      flexShrink={1}
      minWidth={0}
      $md={{ row: false, alignItems: 'flex-start' }}
    >
      {isLoading ? (
        <Text variant="body3" color="$neutral2">
          {t('common.marketPrice.fetching')}
        </Text>
      ) : price ? (
        // Flex defaults to shrink-0 + min-width:auto, so a very long price would hold its full width and push
        // sibling controls (e.g. the chart's token toggle) out of the card instead of wrapping.
        <Flex flexShrink={1} minWidth={0}>
          <Text variant="body3" color="$neutral2">
            {t('common.currentPrice')}
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
        <Flex row alignItems="flex-start" gap="$spacing4" width="100%" flexShrink={1}>
          <AlertTriangleFilled size={16} color="$neutral2" flexShrink={0} mt="$spacing2" />
          <Text variant="body3" color="$neutral2" flex={1}>
            {t('common.marketPrice.unavailable')}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
