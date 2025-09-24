import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Check, Laptop } from 'ui/src/components/icons'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { ScantasticCompleteNotification as ScantasticCompleteNotificationType } from 'uniswap/src/features/notifications/slice/types'

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
            <Laptop color="$accent1" size="$icon.24" />
          </Flex>
          <Flex
            backgroundColor="$statusSuccess"
            borderColor="$surface1"
            borderRadius="$roundedFull"
            borderWidth="$spacing2"
            bottom={0}
            p="$spacing4"
            position="absolute"
            right={0}
          >
            <Check color="$white" size="$icon.8" />
          </Flex>
        </Flex>
      }
      subtitle={t('notifications.scantastic.subtitle')}
      title={t('notifications.scantastic.title')}
    />
  )
}
