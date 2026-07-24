import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'

/**
 * QuickLaunch: the quick-launch trust badge, reused at create-time, in discovery, and on the
 * auction detail header. Promote to ui/src on graduation.
 */
export function LiquidityLockedBadge({ size = 'default' }: { size?: 'small' | 'default' }): JSX.Element {
  const { t } = useTranslation()
  const isSmall = size === 'small'

  return (
    <MouseoverTooltip placement="top" size={TooltipSize.Small} text={t('toucan.liquidityLockedBadge.tooltip')}>
      <Flex
        row
        alignItems="center"
        gap="$spacing4"
        backgroundColor="$surface2"
        borderRadius="$roundedFull"
        px={isSmall ? '$spacing6' : '$spacing8'}
        py="$spacing2"
        width="fit-content"
      >
        <Lock size={isSmall ? '$icon.12' : '$icon.16'} color="$neutral2" />
        <Text variant={isSmall ? 'body4' : 'body3'} color="$neutral2" $platform-web={{ whiteSpace: 'nowrap' }}>
          {t('toucan.liquidityLockedBadge.label')}
        </Text>
      </Flex>
    </MouseoverTooltip>
  )
}
