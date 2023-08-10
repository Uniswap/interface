import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { TabsAwareBottomBanner } from 'src/components/banners/TabsAwareBottomBanner'
import { selectSomeModalOpen } from 'src/features/modals/modalSlice'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

export function OfflineBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const netInfo = useNetInfo()

  // don't show the offline banner in onboarding
  const finishedOnboarding = useAppSelector(selectFinishedOnboarding)
  const isModalOpen = useAppSelector(selectSomeModalOpen)

  // Needs to explicity check for false since `netInfo.isConnected` may be null
  const showBanner = netInfo.isConnected === false && finishedOnboarding && !isModalOpen

  if (__DEV__) {
    // do not check in Dev mode since the simulator
    // gets funky with the network state:
    // https://github.com/react-native-netinfo/react-native-netinfo/issues/7
    return null
  }

  return showBanner ? (
    <TabsAwareBottomBanner
      icon={
        <InfoCircle
          color={theme.colors.neutral1}
          height={theme.iconSizes.icon24}
          width={theme.iconSizes.icon24}
        />
      }
      text={t('You are in offline mode')}
    />
  ) : null
}
