import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'

export function LiquidityPositionAmountsTile({
  currency0Amount,
  currency1Amount,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
}) {
  // TODO(WEB-4920): skip GraphQL call once backend provides image URLs
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  // TODO(WEB-4920): calculate real values for USD amounts and percentages
  return (
    <Flex borderRadius="$rounded12" gap="$gap12" backgroundColor="$surface3" p="$padding16">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$gap16">
          <CurrencyLogo currencyInfo={currencyInfo0} size={20} />
          <Text variant="body1" color="neutral1">
            {currency0Amount.currency.symbol}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body1" color="$neutral1">
            {currency0Amount.toFixed()}
          </Text>
          <Text variant="body1" color="$neutral2">
            ($0)
          </Text>
          <Flex backgroundColor="$surface1" borderRadius="$rounded12" px="$padding8" py="$padding8">
            <Text variant="body1" color="$neutral1">
              45%
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$gap16">
          <CurrencyLogo currencyInfo={currencyInfo1} size={20} />
          <Text variant="body1" color="$neutral1">
            {currency1Amount.currency.symbol}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body1" color="neutral1">
            {currency1Amount.toFixed()}
          </Text>
          <Text variant="body1" color="$neutral2">
            ($0)
          </Text>
          <Flex backgroundColor="$surface1" borderRadius="$rounded12" px="$padding8" py="$padding8">
            <Text variant="body1" color="$neutral1">
              55%
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
