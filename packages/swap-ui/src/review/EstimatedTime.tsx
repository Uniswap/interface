import { Flex, Text } from '@universe/mycelium'
import { Stopwatch } from '@universe/mycelium/icons/Stopwatch'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'

export interface EstimatedTimeProps {
  /** Whether to show icon (stopwatch) */
  showIcon?: boolean
  /** Estimated time text */
  contentText?: string
}

export function EstimatedTime({ showIcon = false, contentText }: EstimatedTimeProps): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {t('swap.details.estimatedTime')}
      </Text>
      <Flex row alignItems="center" gap="$spacing2">
        {showIcon && <Stopwatch size="$icon.16" color={colors.accent1.val} />}
        <Text adjustsFontSizeToFit color="$neutral1" numberOfLines={1} variant="body3">
          {contentText}
        </Text>
      </Flex>
    </Flex>
  )
}
