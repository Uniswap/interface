import { memo, ReactNode } from 'react'
import { Flex } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { zIndexes } from 'ui/src/theme'
import { CurrencyLogo, STATUS_RATIO } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

interface Props {
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  inputLogoUrl?: string
  outputLogoUrl?: string
  inputFallbackSymbol?: string
  outputFallbackSymbol?: string
  size: number
  chainId: UniverseChainId | null
  customIcon?: ReactNode
}

/*
 * Logo, where left 50% of width is taken from one icon (its left 50%)
 * and right side is taken from another icon (its right 50%)
 */
export function SplitLogo({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
  inputLogoUrl,
  outputLogoUrl,
  inputFallbackSymbol,
  outputFallbackSymbol,
  chainId,
  customIcon,
}: Props): JSX.Element {
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
        {inputLogoUrl || inputFallbackSymbol ? (
          <TokenLogo
            hideNetworkLogo
            url={inputLogoUrl}
            chainId={chainId ?? undefined}
            size={size}
            symbol={inputFallbackSymbol}
          />
        ) : (
          <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size} />
        )}
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
        {outputLogoUrl || outputFallbackSymbol ? (
          <TokenLogo
            hideNetworkLogo
            url={outputLogoUrl}
            chainId={chainId ?? undefined}
            size={size}
            symbol={outputFallbackSymbol}
          />
        ) : (
          <CurrencyLogo hideNetworkLogo currencyInfo={outputCurrencyInfo} size={size} />
        )}
      </Flex>
      {(customIcon || networkLogo) && (
        <Flex bottom={-4} position="absolute" right={-4} zIndex={zIndexes.mask}>
          {customIcon ?? networkLogo}
        </Flex>
      )}
    </Flex>
  )
}

/**
 * Icon for cross-chain transactions. Icon is grey until TX is successful.
 */
export const CrossChainIcon = memo(function CrossChainIcon({ status }: { status: TransactionStatus }): JSX.Element {
  const backgroundColor = status === TransactionStatus.Success ? '$statusSuccess' : '$neutral2'

  return (
    //  Since the backgroundColor might be opaque, this outer div ensures the background color is solid.
    <Flex
      testID="cross-chain-icon"
      borderColor="$surface1"
      borderWidth="$spacing2"
      borderRadius="$roundedFull"
      overflow="hidden"
      backgroundColor="$background"
    >
      <Flex
        borderRadius="$roundedFull"
        overflow="hidden"
        backgroundColor={backgroundColor}
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        p="$spacing1"
      >
        <Shuffle size="$icon.12" color="$surface1" />
      </Flex>
    </Flex>
  )
})
