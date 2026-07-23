import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

/** One chain under an expanded multichain parent (extension). */
export const ChainBalanceRow = memo(function ChainBalanceRowInner({
  chainId,
  symbol,
  quantity,
  valueUsd,
}: {
  chainId: number
  symbol: string | undefined
  quantity: number
  valueUsd: number | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const shortenedSymbol = getSymbolDisplayText(symbol)
  const networkName = getChainLabel(chainId as UniverseChainId)
  const networkLogoTooltip = t('portfolio.tokens.multichainChainRow.tooltip', {
    symbol: shortenedSymbol ?? '—',
    networkName,
  })

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface1"
      borderRadius="$rounded12"
      height={48}
      justifyContent="space-between"
      px="$spacing8"
      hoverStyle={{ backgroundColor: '$surface2' }}
    >
      <Flex row shrink alignItems="center" gap="$spacing12">
        <Tooltip placement="right" delay={0} restMs={0} offset={{ mainAxis: 8 }}>
          <Tooltip.Trigger>
            <Flex centered width="$spacing40" height="$spacing40" cursor="default">
              <NetworkLogo chainId={chainId as UniverseChainId} size={24} />
            </Flex>
          </Tooltip.Trigger>
          <Tooltip.Content animationDirection="right">
            <Text variant="body4">{networkLogoTooltip}</Text>
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip>
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {`${formatNumberOrString({ value: quantity })} ${shortenedSymbol}`}
        </Text>
      </Flex>
      <AnimatedNumber
        alignRight
        numericValue={valueUsd}
        textVariant="$body3"
        value={convertFiatAmountFormatted(valueUsd, NumberType.FiatTokenQuantity)}
        disableAnimations={!isDataLivelinessEnabled}
      />
    </Flex>
  )
})
