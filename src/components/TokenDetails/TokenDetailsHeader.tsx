import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { SafetyLevel } from 'src/features/dataApi/types'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'

export interface TokenDetailsHeaderProps {
  currency: Currency
  safetyLevel: NullUndefined<SafetyLevel>
  onPressWarningIcon: () => void
}

export function TokenDetailsHeader({
  currency,
  safetyLevel,
  onPressWarningIcon,
}: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  return (
    <Flex mx="sm">
      <CurrencyLogo currency={currency} size={36} />
      <Flex row alignItems="center" gap="xs">
        <Text color="textPrimary" numberOfLines={1} style={flex.shrink} variant="subheadLarge">
          {currency.name ?? t('Unknown token')}
        </Text>
        {/* Suppress warning icon on low warning level */}
        {(safetyLevel === SafetyLevel.Strong || safetyLevel === SafetyLevel.Blocked) && (
          <TouchableArea onPress={onPressWarningIcon}>
            <WarningIcon
              height={theme.iconSizes.md}
              safetyLevel={safetyLevel}
              width={theme.imageSizes.sm}
            />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
