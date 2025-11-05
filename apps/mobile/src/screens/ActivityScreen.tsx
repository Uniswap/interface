import { useScrollToTop } from '@react-navigation/native'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { ActivityContent } from 'src/components/activity/ActivityContent'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function ActivityScreen(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const dispatch = useDispatch()
  const scrollRef = useRef(null)

  useScrollToTop(scrollRef)

  const insets = useAppInsets()
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  const containerProps = useMemo(
    () => ({
      contentContainerStyle: {
        paddingBottom: isBottomTabsEnabled ? ESTIMATED_BOTTOM_TABS_HEIGHT + insets.bottom + spacing.spacing32 : 0,
      },
    }),
    [isBottomTabsEnabled, insets.bottom],
  )

  // clear all notification indicator if the user is on the activity screen
  const hasNotifications = useSelectAddressHasNotifications(activeAccount.address)

  useEffect(() => {
    if (hasNotifications) {
      dispatch(setNotificationStatus({ address: activeAccount.address, hasNotifications: false }))
    }
  }, [hasNotifications, activeAccount.address, dispatch])

  return (
    <Screen>
      <Text variant="heading3" py="$padding16" px="$spacing24">
        {t('common.activity')}
      </Text>
      <ActivityContent ref={scrollRef} containerProps={containerProps} owner={activeAccount.address} />
    </Screen>
  )
}
