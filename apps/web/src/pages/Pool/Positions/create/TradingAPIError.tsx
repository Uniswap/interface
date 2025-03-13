import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { RotateLeft } from 'ui/src/components/icons/RotateLeft'

export function TradingAPIError({ errorMessage, refetch }: { errorMessage: boolean | string; refetch?: () => void }) {
  const { t } = useTranslation()

  if (!errorMessage) {
    return null
  }

  return (
    <Flex row gap="$spacing12" backgroundColor="$surface2" borderRadius="$rounded16" p="$padding12">
      <Flex backgroundColor="$statusCritical2" p="$padding12" borderRadius="$rounded12" mb="auto">
        <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
      </Flex>
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text color="$statusCritical" variant="body3">
          {t('common.card.error.description')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('pool.liquidity.data.error.message')}
        </Text>
        {/* the error message will be of type true or a string. True means there was an error but the message is unknown. */}
        {errorMessage !== true && (
          <Text variant="body3" color="$neutral3">
            {t('common.error.label')}: {errorMessage}
          </Text>
        )}
        {Boolean(refetch) && (
          <TouchableArea {...ClickableTamaguiStyle} onPress={refetch} mt="$spacing2">
            <Flex row gap="$gap4">
              <RotateLeft size="$icon.16" color="$neutral1" />
              <Text variant="buttonLabel3">{t('common.button.tryAgain')}</Text>
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
