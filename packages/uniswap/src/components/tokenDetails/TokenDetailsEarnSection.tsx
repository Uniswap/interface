import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

type TokenDetailsEarnSectionProps = {
  earnPosition: EarnPositionInfo
  earnVault: EarnVaultInfo
  onPositionPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
  onWithdrawPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
  onDepositPress: (vault: EarnVaultInfo, position: EarnPositionInfo) => void
}

export function TokenDetailsEarnSection({
  earnPosition,
  earnVault,
  onPositionPress,
  onWithdrawPress,
  onDepositPress,
}: TokenDetailsEarnSectionProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  return (
    <Flex gap="$spacing12" width="100%">
      <Flex gap="$spacing8" width="100%">
        <Text variant="body1" color="$neutral1">
          {t('explore.earn.title')}
        </Text>

        <TouchableArea
          row
          alignItems="center"
          gap="$spacing8"
          width="100%"
          py="$spacing4"
          borderRadius="$rounded8"
          hoverStyle={{ backgroundColor: '$surface2' }}
          onPress={() => onPositionPress(earnVault, earnPosition)}
        >
          <Text variant="body2" color="$neutral2" flex={1} minWidth={0}>
            {t('explore.earn.vault.deposited')}
          </Text>
          <Text variant="body2" color="$neutral1" textAlign="right" whiteSpace="nowrap">
            {convertFiatAmountFormatted(earnPosition.depositedUsd, NumberType.PortfolioBalance)}
          </Text>
          <Flex width="$spacing4" height="$spacing4" borderRadius="$roundedFull" backgroundColor="$neutral3" />
          <Text variant="body2" color="$accent1" textAlign="right" whiteSpace="nowrap">
            {t('explore.earn.apy', { apy: formatPercent(earnPosition.apyPercent) })}
          </Text>
          <RotatableChevron direction="right" color="$neutral2" size="$icon.16" />
        </TouchableArea>
      </Flex>

      <Flex row gap="$spacing8">
        <Button size="small" emphasis="tertiary" onPress={() => onWithdrawPress(earnVault, earnPosition)}>
          {t('explore.earn.vault.withdraw')}
        </Button>
        <Button size="small" emphasis="secondary" onPress={() => onDepositPress(earnVault, earnPosition)}>
          {t('explore.earn.vault.deposit')}
        </Button>
      </Flex>
    </Flex>
  )
}
