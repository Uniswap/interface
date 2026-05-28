import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type CrossChainCurrencyRowProps = {
  inputChainId: UniverseChainId | null
  inputSymbol: string
  outputChainId: UniverseChainId | null
  outputSymbol: string
  formattedInputTokenAmount: string
  formattedOutputTokenAmount: string
}
/**
 * Component to display cross-chain transactions with two logos and currency amounts
 * 💶Token -> 💴Token
 */
export function CrossChainCurrencyRow({
  inputChainId,
  inputSymbol,
  outputChainId,
  outputSymbol,
  formattedInputTokenAmount,
  formattedOutputTokenAmount,
}: CrossChainCurrencyRowProps): JSX.Element {
  return (
    <Flex grow row py="$spacing2" gap="$spacing4" alignItems="center" flexWrap="wrap">
      <CurrencyAmount chainId={inputChainId} amount={formattedInputTokenAmount} symbol={inputSymbol} />
      <Text>→</Text>
      <CurrencyAmount chainId={outputChainId} amount={formattedOutputTokenAmount} symbol={outputSymbol} />
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
