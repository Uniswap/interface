import { TableText } from 'components/Table/styled'
import { memo } from 'react'
import { EM_DASH, Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

const TokenDisplay = memo(function TokenDisplay({ currencyInfo }: { currencyInfo: CurrencyInfo | null }) {
  if (!currencyInfo) {
    return <TableText>{EM_DASH}</TableText>
  }

  const { currency } = currencyInfo

  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <TokenLogo
        chainId={currency.chainId}
        name={currency.name}
        symbol={getSymbolDisplayText(currency.symbol) || undefined}
        size={32}
        url={currencyInfo.logoUrl}
      />
      <Flex>
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {currency.name || EM_DASH}
        </Text>
        <Text variant="body4" color="$neutral2" numberOfLines={1}>
          {getSymbolDisplayText(currency.symbol) || EM_DASH}
        </Text>
      </Flex>
    </Flex>
  )
})
TokenDisplay.displayName = 'TokenDisplay'

export default TokenDisplay
