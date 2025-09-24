import { useTranslation } from 'react-i18next'
import { SvgUri } from 'react-native-svg'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'
import { ChooseCountryNotification as ChooseCountryNotificationType } from 'uniswap/src/features/notifications/slice/types'

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
