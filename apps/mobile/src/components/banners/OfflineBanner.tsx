import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { BANNER_HEIGHT, BottomBanner } from 'src/components/banners/BottomBanner'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

const EXTRA_MARGIN = 5

export function OfflineBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const netInfo = useNetInfo()

  // don't show the offline banner in onboarding
  const finishedOnboarding = useSelector(selectFinishedOnboarding)
  const isModalOpen = useSelector(selectSomeModalOpen)

  // Needs to explicity check for false since `netInfo.isConnected` may be null
  const showBanner = netInfo.isConnected === false && finishedOnboarding && !isModalOpen

  if (__DEV__) {
    // do not check in Dev mode since the simulator
    // gets funky with the network state:
    // https://github.com/react-native-netinfo/react-native-netinfo/issues/7
    return null
  }

  return showBanner ? (
    <BottomBanner
      backgroundColor="$surface2"
      icon={<InfoCircle color="$neutral1" size="$icon.24" />}
      text={t('home.banner.offline')}
      translateY={BANNER_HEIGHT - EXTRA_MARGIN}
    />
  ) : null
}
