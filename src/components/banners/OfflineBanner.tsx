import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { TabsAwareBottomBanner } from 'src/components/banners/TabsAwareBottomBanner'

export function OfflineBanner() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const netInfo = useNetInfo()

  if (__DEV__) {
    // do not check in Dev mode since the simulator
    // gets funky with the network state:
    // https://github.com/react-native-netinfo/react-native-netinfo/issues/7
    return null
  }

  return netInfo.isConnected === false ? (
    <TabsAwareBottomBanner
      icon={
        <InfoCircle
          color={theme.colors.textPrimary}
          height={theme.iconSizes.lg}
          width={theme.iconSizes.lg}
        />
      }
      text={t('You are in offline mode')}
    />
  ) : null
}
