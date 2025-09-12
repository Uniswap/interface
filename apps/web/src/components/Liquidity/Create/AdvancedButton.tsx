import { MouseoverTooltip } from 'components/Tooltip'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, GeneratedIcon, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function AdvancedButton({
  title,
  tooltipText,
  Icon,
  onPress,
  elementName,
}: {
  title: string
  tooltipText?: string
  Icon: GeneratedIcon
  onPress: () => void
  elementName?: ElementName
}) {
  const { t } = useTranslation()
  return (
    <Flex row gap="$spacing8" alignItems="center">
      <Flex row gap="$spacing4" alignItems="center">
        <Icon size="$icon.16" color="$neutral2" />
        <Trace logPress={!!elementName} element={elementName}>
          <Text
            variant="body3"
            color="$neutral2"
            textDecorationLine="underline"
            textDecorationStyle="dashed"
            onPress={onPress}
            {...ClickableTamaguiStyle}
          >
            {title}
          </Text>
        </Trace>
      </Flex>
      <Text variant="body3" color="$neutral3">
        ({t('common.advanced')})
      </Text>
      {tooltipText && (
        <MouseoverTooltip text={tooltipText} placement="auto" style={{ maxHeight: '16px' }}>
          <Flex>
            <InfoCircleFilled size="$icon.16" color="$neutral3" />
          </Flex>
        </MouseoverTooltip>
      )}
    </Flex>
  )
}
