import { useTranslation } from 'react-i18next'
import { Text, TouchableArea } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

export function EarnVaultChip({ vault, onPress }: { vault: EarnVaultInfo; onPress: () => void }) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency

  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$spacing12"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      backgroundColor="$surface1"
      px="$spacing16"
      py="$spacing12"
      flex={1}
      maxWidth={240}
      minWidth={0}
      hoverStyle={{ backgroundColor: '$surface2' }}
      $md={{ maxWidth: '100%' }}
      onPress={onPress}
    >
      <TokenLogo
        url={currencyInfo?.logoUrl}
        size={iconSizes.icon32}
        chainId={currency?.chainId}
        symbol={currency?.symbol}
        name={currency?.name}
        hideNetworkLogo
      />
      <Flex flex={1} minWidth={0}>
        <Text variant="body2" color="$neutral1" numberOfLines={1}>
          {currency?.symbol ?? '-'}
        </Text>
        <Text variant="body3" color="$accent1" numberOfLines={1}>
          {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
