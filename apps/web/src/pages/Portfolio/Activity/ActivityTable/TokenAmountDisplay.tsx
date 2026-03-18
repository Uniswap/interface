import { memo } from 'react'
import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

interface TokenAmountDisplayProps {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  formattedAmount: string | null
  usdValue: string | null
}

function _TokenAmountDisplay({ currencyInfo, formattedAmount, usdValue }: TokenAmountDisplayProps) {
  if (!currencyInfo || !formattedAmount) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap8">
      <CurrencyLogo currencyInfo={currencyInfo} size={32} />
      <Flex gap="$gap2">
        <Text variant="body3" fontWeight="500">
          {formattedAmount}
        </Text>
        {usdValue && (
          <Text variant="body3" color="$neutral2">
            {usdValue}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export const TokenAmountDisplay = memo(_TokenAmountDisplay)
