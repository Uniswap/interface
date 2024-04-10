import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons } from 'ui/src'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { ScantasticCompleteNotification as ScantasticCompleteNotificationType } from 'wallet/src/features/notifications/types'

export function ScantasticCompleteNotification({
  notification: { hideDelay },
}: {
  notification: ScantasticCompleteNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <NotificationToast
      hideDelay={hideDelay}
      icon={
        <Flex position="relative">
          <Flex backgroundColor="$accent2" borderRadius="$roundedFull" p="$spacing12">
            <Icons.Laptop color="$accent1" size="$icon.24" />
          </Flex>
          <Flex
            backgroundColor="$statusSuccess"
            borderRadius="$roundedFull"
            bottom={0}
            p="$spacing4"
            position="absolute"
            right={0}>
            <Icons.Check color="$white" size="$icon.8" />
          </Flex>
        </Flex>
      }
      subtitle={t('notifications.scantastic.subtitle')}
      title={t('notifications.scantastic.title')}
    />
  )
}
