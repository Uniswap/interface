import { Currency, Price } from '@uniswap/sdk-core'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { BaseQuoteFiatAmount } from '~/components/Liquidity/BaseQuoteFiatAmount'

export function DisplayCurrentPrice({ price, isLoading }: { price?: Price<Currency, Currency>; isLoading?: boolean }) {
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
