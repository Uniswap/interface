import { TableText } from 'components/Table/styled'
import { Flex } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

interface TokenAmountDisplayProps {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  formattedAmount: string | null
  usdValue: string | null
}

export function TokenAmountDisplay({ currencyInfo, formattedAmount, usdValue }: TokenAmountDisplayProps) {
  if (!currencyInfo || !formattedAmount) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$gap8">
      <CurrencyLogo currencyInfo={currencyInfo} size={32} />
      <Flex gap="$gap2">
        <TableText variant="body3" fontWeight="500">
          {formattedAmount}
        </TableText>
        {usdValue && (
          <TableText variant="body3" color="$neutral2">
            {usdValue}
          </TableText>
        )}
      </Flex>
    </Flex>
  )
}
