import { ReactComponent as Unicon } from 'assets/svg/demo-wallet-emblem.svg'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { iconSizes, zIndexes } from 'ui/src/theme'

export function DemoAddressDisplay() {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing12">
      <Flex
        borderRadius="$roundedFull"
        backgroundColor="$accent2"
        width={iconSizes.icon48}
        height={iconSizes.icon48}
        centered
      >
        <Unicon width={32} height={32} style={{ color: colors.accent1.val }} fill={colors.accent1.val} />
      </Flex>
      <Tooltip>
        <Tooltip.Trigger>
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="subheading1" color="$neutral1">
              {t('portfolio.disconnected.demoWallet.title')}
            </Text>
            <Eye color="$neutral2" size="$icon.16" />
          </Flex>
        </Tooltip.Trigger>
        <Tooltip.Content ml="$spacing8" zIndex={zIndexes.overlay}>
          <Text variant="body4">{t('portfolio.disconnected.demoWallet.description')}</Text>
        </Tooltip.Content>
      </Tooltip>
    </Flex>
  )
}
