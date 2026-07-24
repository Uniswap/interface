import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export type OnSelectEarnVault = (args: { vault: EarnVaultInfo; position?: EarnPositionInfo }) => void

export const DiscoveryVaultRow = memo(function DiscoveryVaultRow({
  vault,
  onSelect,
}: {
  vault: EarnVaultInfo
  onSelect: OnSelectEarnVault
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currency = currencyInfo?.currency

  const handlePress = useCallback(() => onSelect({ vault }), [onSelect, vault])

  return (
    <TouchableArea testID={`${TestID.HomeEarnDiscoveryVaultPrefix}${vault.id}`} onPress={handlePress}>
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          hideNetworkLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon28}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Flex fill minWidth={0}>
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {currency?.symbol ?? '-'}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="body2" color="$accent1">
            {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
          </Text>
          <RotatableChevron color="$neutral3" direction="right" size="$icon.20" />
        </Flex>
      </Flex>
    </TouchableArea>
  )
})
