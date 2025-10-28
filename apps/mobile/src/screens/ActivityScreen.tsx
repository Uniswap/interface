import { useApolloClient } from '@apollo/client'
import { useScrollToTop } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { GQLQueries } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { ActivityContent } from 'src/components/activity/ActivityContent'
import { Screen } from 'src/components/layout/Screen'
import { useAppStateTrigger } from 'src/utils/useAppStateTrigger'
import { Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const useRefreshActivityData = (owner: Address): { refreshing: boolean; onRefreshActivityData: () => void } => {
  const apolloClient = useApolloClient()

  const refreshFn = useCallback(
    () =>
      apolloClient.refetchQueries({
        include: [GQLQueries.TransactionList],
      }),
    [apolloClient],
  )

  const { refetch, isRefetching } = useQuery({
    queryKey: [ReactQueryCacheKey.ActivityScreenRefresh, owner],
    enabled: false,
    retry: 0,
    queryFn: refreshFn,
  })

  return { refreshing: isRefetching, onRefreshActivityData: refetch }
}

export function ActivityScreen(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const dispatch = useDispatch()
  const scrollRef = useRef(null)

  useScrollToTop(scrollRef)

  const { refreshing, onRefreshActivityData } = useRefreshActivityData(activeAccount.address)

  // Automatically refresh activity data when app comes to foreground
  useAppStateTrigger({
    from: 'background',
    to: 'active',
    callback: onRefreshActivityData,
  })

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
      <ActivityContent
        ref={scrollRef}
        refreshing={refreshing}
        containerProps={containerProps}
        owner={activeAccount.address}
        onRefresh={onRefreshActivityData}
      />
    </Screen>
  )
}
