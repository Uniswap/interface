import { Flex } from 'ui/src'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ChainId } from 'uniswap/src/types/chains'
import { CurrencyLogo, STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'

interface Props {
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  size: number
  chainId: ChainId | null
}

/*
 * Logo, where left 50% of width is taken from one icon (its left 50%)
 * and right side is taken from another icon (its right 50%)
 */
export function SplitLogo({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
  chainId,
}: Props): JSX.Element {
  const iconSize = size / 2

  const icon =
    chainId && chainId !== ChainId.Mainnet ? (
      <TransactionSummaryNetworkLogo chainId={chainId} size={size * STATUS_RATIO} />
    ) : undefined

  return (
    <Flex height={size} width={size}>
      <Flex
        left={0}
        overflow="hidden"
        position="absolute"
        testID="input-currency-logo-container"
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}>
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size} />
      </Flex>
      <Flex
        flexDirection="row-reverse"
        overflow="hidden"
        position="absolute"
        right={0}
        testID="output-currency-logo-container"
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}>
        <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrencyInfo} size={size} />
      </Flex>
      {icon && (
        <Flex bottom={-4} position="absolute" right={-4}>
          {icon}
        </Flex>
      )}
    </Flex>
  )
}
