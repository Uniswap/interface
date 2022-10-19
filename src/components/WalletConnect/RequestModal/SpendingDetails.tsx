import { CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogoOnly } from 'src/components/CurrencyLogo'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { formatUSDPrice } from 'src/utils/format'

export function SpendingDetails({
  currencyAmount,
}: {
  currencyAmount: CurrencyAmount<NativeCurrency>
}) {
  const { t } = useTranslation()

  const { name, symbol } = currencyAmount.currency
  const usdValue = useUSDCValue(currencyAmount)

  return (
    <Flex gap="xs">
      <Text color="textSecondary" variant="bodySmall">
        {t('Send')}
      </Text>
      <Flex row>
        <Flex grow row alignItems="center" gap="xs">
          <CurrencyLogoOnly currency={currencyAmount.currency} size={32} />
          <Box>
            <Text variant="subheadLarge">{name}</Text>
            <Text color="textSecondary" fontSize={12}>
              {symbol}
            </Text>
          </Box>
        </Flex>
        <Box alignItems="flex-end">
          <Text variant="bodyLarge">{currencyAmount?.toExact()}</Text>
          <Text color="textSecondary" fontSize={12}>
            {formatUSDPrice(usdValue?.toExact())}
          </Text>
        </Box>
      </Flex>
    </Flex>
  )
}
