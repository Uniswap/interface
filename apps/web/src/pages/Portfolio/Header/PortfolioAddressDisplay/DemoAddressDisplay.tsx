import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { iconSizes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ReactComponent as Unicon } from '~/assets/svg/demo-wallet-emblem.svg'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'

export function DemoAddressDisplay({ isCompact }: { isCompact: boolean }) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const iconSize = isCompact ? iconSizes.icon24 : iconSizes.icon48
  const uniconSize = isCompact ? 16 : 32

  return (
    <Flex row alignItems="center" gap="$spacing12" testID={TestID.DemoWalletDisplay}>
      <Flex
        borderRadius="$roundedFull"
        backgroundColor="$accent2"
        width={iconSize}
        height={iconSize}
        centered
        transition={HEADER_TRANSITION}
      >
        <Unicon
          width={uniconSize}
          height={uniconSize}
          style={{ color: colors.accent1.val }}
          fill={colors.accent1.val}
        />
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
        <Tooltip.Content ml="$spacing8">
          <Text variant="body4">{t('portfolio.disconnected.demoWallet.description')}</Text>
        </Tooltip.Content>
      </Tooltip>
    </Flex>
  )
}
