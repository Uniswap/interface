import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from 'src/app/hooks'
import { TabsAwareBottomBanner } from 'src/components/banners/TabsAwareBottomBanner'
import { selectSomeModalOpen } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

export function OfflineBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
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
          color={colors.neutral1.val}
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      }
      text={t('You are in offline mode')}
    />
  ) : null
}
