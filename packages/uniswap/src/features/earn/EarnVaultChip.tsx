import { useTranslation } from 'react-i18next'
import { Text, TouchableArea } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'

export const EARN_VAULT_CHIP_MAX_WIDTH = 240
export const EARN_VAULT_CHIP_FRAME_PROPS = {
  row: true,
  alignItems: 'center',
  gap: '$spacing12',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  backgroundColor: '$surface1',
  px: '$spacing16',
  py: '$spacing12',
  flex: 1,
  maxWidth: EARN_VAULT_CHIP_MAX_WIDTH,
  minWidth: 0,
  $md: { maxWidth: '100%' },
} as const

export function EarnVaultChip({
  onPress,
  position,
  vault,
}: {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currency = currencyInfo?.currency
  const depositedUsd = position?.depositedUsd
  const depositedLabel =
    depositedUsd !== undefined && depositedUsd > 0
      ? convertFiatAmountFormatted(depositedUsd, NumberType.PortfolioBalance)
      : undefined

  return (
    <TouchableArea {...EARN_VAULT_CHIP_FRAME_PROPS} hoverStyle={{ backgroundColor: '$surface2' }} onPress={onPress}>
      <TokenLogo
        hideNetworkLogo
        url={currencyInfo?.logoUrl}
        size={iconSizes.icon32}
        chainId={currency?.chainId}
        symbol={currency?.symbol}
        name={currency?.name}
      />
      <Flex flex={1} minWidth={0}>
        <Text variant="body2" color="$neutral1" numberOfLines={1}>
          {currency?.symbol ?? '-'}
        </Text>
        <Flex row alignItems="center" gap="$spacing8">
          {depositedLabel ? (
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {depositedLabel}
            </Text>
          ) : null}
          <Text variant="body3" color="$accent1" numberOfLines={1}>
            {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
