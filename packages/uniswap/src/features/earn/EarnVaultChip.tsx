import { useTranslation } from 'react-i18next'
import { Text, TouchableArea } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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

export function EarnVaultChip({ onPress, vault }: { vault: EarnVaultInfo; onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currency = currencyInfo?.currency

  return (
    <TouchableArea
      {...EARN_VAULT_CHIP_FRAME_PROPS}
      hoverStyle={{ backgroundColor: '$surface2' }}
      testID={`${TestID.EarnVaultChipPrefix}${currency?.symbol}`}
      onPress={onPress}
    >
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
        <Text variant="body3" color="$accent1" numberOfLines={1}>
          {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export function EarnVaultChipSkeleton(): JSX.Element {
  return (
    <Flex {...EARN_VAULT_CHIP_FRAME_PROPS} testID={TestID.EarnVaultChipSkeleton}>
      <Skeleton>
        <Flex row alignItems="center" gap="$spacing12">
          <Flex
            backgroundColor="$neutral3"
            borderRadius="$roundedFull"
            height={iconSizes.icon32}
            width={iconSizes.icon32}
          />
          <Flex>
            <Text loading="no-shimmer" loadingPlaceholderText="USDC" numberOfLines={1} variant="body2" />
            <Text loading="no-shimmer" loadingPlaceholderText="4.30% est. APY" numberOfLines={1} variant="body3" />
          </Flex>
        </Flex>
      </Skeleton>
    </Flex>
  )
}
