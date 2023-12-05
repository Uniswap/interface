import { Flex } from 'ui/src'
import { CurrencyLogo, STATUS_RATIO } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { TransactionSummaryNetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

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
        top={0}
        width={iconSize - 1 /* -1 to allow for space between the icons */}>
        <CurrencyLogo hideNetworkLogo currencyInfo={inputCurrencyInfo} size={size} />
      </Flex>
      <Flex
        flexDirection="row-reverse"
        overflow="hidden"
        position="absolute"
        right={0}
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
