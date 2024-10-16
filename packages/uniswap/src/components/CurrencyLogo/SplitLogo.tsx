import { ReactNode } from 'react'
import { Flex } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo, STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniverseChainId } from 'uniswap/src/types/chains'

interface Props {
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  size: number
  chainId: UniverseChainId | null
  customIcon?: ReactNode
}

/*
 * Logo, where left 50% of width is taken from one icon (its left 50%)
 * and right side is taken from another icon (its right 50%)
 */
export function SplitLogo({ size, inputCurrencyInfo, outputCurrencyInfo, chainId, customIcon }: Props): JSX.Element {
  const iconSize = size / 2
  const networkLogo =
    chainId && chainId !== UniverseChainId.Mainnet ? (
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
        width={iconSize - 1 /* -1 to allow for space between the icons */}
      >
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size} />
      </Flex>
      <Flex
        flexDirection="row-reverse"
        overflow="hidden"
        position="absolute"
        right={0}
        testID="output-currency-logo-container"
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}
      >
        <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrencyInfo} size={size} />
      </Flex>
      {(customIcon || networkLogo) && (
        <Flex bottom={-4} position="absolute" right={-4}>
          {customIcon ?? networkLogo}
        </Flex>
      )}
    </Flex>
  )
}

export const BridgeIcon = (
  <Flex
    testID="bridge-icon"
    borderColor="$surface1"
    borderWidth="$spacing2"
    borderRadius="$roundedFull"
    overflow="hidden"
    backgroundColor="$statusSuccess"
    p="$spacing1"
  >
    <Shuffle size={iconSizes.icon12} color="$surface1" backgroundColor="$statusSuccess" />
  </Flex>
)
