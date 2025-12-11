import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

/**
 * Component to display bridge swaps with two logos and currency amounts
 * 💶Token -> 💴Token
 */
export function BridgingCurrencyRow({
  inputCurrencyInfo,
  outputCurrencyInfo,
  formattedInputTokenAmount,
  formattedOutputTokenAmount,
}: {
  inputCurrencyInfo?: Maybe<CurrencyInfo>
  outputCurrencyInfo?: Maybe<CurrencyInfo>
  formattedInputTokenAmount: string
  formattedOutputTokenAmount: string
}): JSX.Element {
  return (
    <Flex grow row py="$spacing2" gap="$spacing4" alignItems="center" flexWrap="wrap">
      <CurrencyAmount
        chainId={inputCurrencyInfo?.currency.chainId ?? null}
        amount={formattedInputTokenAmount}
        symbol={getSymbolDisplayText(inputCurrencyInfo?.currency.symbol) ?? ''}
      />
      <Text>→</Text>
      <CurrencyAmount
        chainId={outputCurrencyInfo?.currency.chainId ?? null}
        amount={formattedOutputTokenAmount}
        symbol={getSymbolDisplayText(outputCurrencyInfo?.currency.symbol) ?? ''}
      />
    </Flex>
  )
}

function CurrencyAmount({
  chainId,
  amount,
  symbol,
}: {
  chainId: UniverseChainId | null
  amount: string
  symbol: string
}): JSX.Element {
  return (
    <Flex row gap="$spacing4" alignItems="center">
      <NetworkLogo chainId={chainId} size={iconSizes.icon16} borderRadius={6} />
      <Text color="$neutral1" variant="body2">
        {amount}
        {symbol}
      </Text>
    </Flex>
  )
}
