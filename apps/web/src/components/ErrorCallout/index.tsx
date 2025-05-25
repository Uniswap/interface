import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'

export function ErrorCallout({
  errorMessage,
  description,
  title,
  isWarning = false,
  action,
  pressIcon = <RotateLeft size="$icon.16" color="$neutral1" />,
  onPress,
}: {
  action?: string
  errorMessage: boolean | string
  description?: string
  title?: string
  isWarning?: boolean
  pressIcon?: React.ReactNode
  onPress?: () => void
}) {
  const { t } = useTranslation()

  if (!errorMessage) {
    return null
  }

  return (
    <Flex row gap="$spacing12" backgroundColor="$surface2" borderRadius="$rounded16" p="$padding12">
      <Flex
        backgroundColor={isWarning ? '$statusWarning2' : '$statusCritical2'}
        p="$padding12"
        borderRadius="$rounded12"
        alignSelf="flex-start"
      >
        <AlertTriangleFilled color={isWarning ? '$statusWarning' : '$statusCritical'} size="$icon.20" />
      </Flex>
      <Flex alignItems="flex-start" flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text color={isWarning ? '$statusWarning' : '$statusCritical'} variant="body3">
          {title || t('common.card.error.description')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {description || t('pool.liquidity.data.error.message')}
        </Text>
        {/* the error message will be of type true or a string. True means there was an error but the message is unknown. */}
        {errorMessage !== true && (
          <Text variant="body3" color="$neutral3">
            {t('common.error.label')}: {errorMessage}
          </Text>
        )}
        {Boolean(onPress) && (
          <TouchableArea row {...ClickableTamaguiStyle} onPress={onPress} mt="$spacing2">
            <Flex row gap="$gap4">
              {pressIcon}
              <Text variant="buttonLabel3">{action || t('common.button.tryAgain')}</Text>
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
