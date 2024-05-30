import { useTranslation } from 'react-i18next'
import { SvgUri } from 'react-native-svg'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getCountryFlagSvgUrl } from 'wallet/src/features/fiatOnRamp/utils'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { ChooseCountryNotification as ChooseCountryNotificationType } from 'wallet/src/features/notifications/types'

export function ChooseCountryNotification({
  notification: { countryName, countryCode, hideDelay },
}: {
  notification: ChooseCountryNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const countryFlagUrl = getCountryFlagSvgUrl(countryCode)
  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={
        <Flex borderRadius="$roundedFull" overflow="hidden">
          <SvgUri height={iconSizes.icon20} uri={countryFlagUrl} width={iconSizes.icon20} />
        </Flex>
      }
      title={t('notification.countryChange', { countryName })}
    />
  )
}
