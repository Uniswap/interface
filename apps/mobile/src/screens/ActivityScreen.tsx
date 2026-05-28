import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { ActivityContent } from 'src/components/activity/ActivityContent'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function ActivityScreen(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const dispatch = useDispatch()
  const insets = useAppInsets()

  const containerProps = useMemo(
    () => ({
      contentContainerStyle: {
        paddingBottom: ESTIMATED_BOTTOM_TABS_HEIGHT + insets.bottom + spacing.spacing32,
      },
    }),
    [insets.bottom],
  )

  // clear all notification indicator if the user is on the activity screen
  const hasNotifications = useSelectAddressHasNotifications(activeAccount.address)

  useEffect(() => {
    if (hasNotifications) {
      dispatch(setNotificationStatus({ address: activeAccount.address, hasNotifications: false }))
    }
  }, [hasNotifications, activeAccount.address, dispatch])

  const [activityError, setActivityError] = useState<Error | undefined>()
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number | undefined>()
  const [isOutageSheetOpen, setIsOutageSheetOpen] = useState(false)

  const handleErrorStateChange = useEvent(({ error, dataUpdatedAt: updatedAt }: DataApiOutageState) => {
    setActivityError(error)
    setDataUpdatedAt(updatedAt)
  })

  const handleOutageBannerPress = useEvent(() => setIsOutageSheetOpen(true))
  const handleOutageSheetClose = useEvent(() => setIsOutageSheetOpen(false))

  return (
    <Screen>
      {activityError ? (
        <DataApiOutageBanner title={t('dataApi.outage.banner.activity.title')} onPress={handleOutageBannerPress} />
      ) : null}
      <DataApiOutageModalContent
        isOpen={isOutageSheetOpen}
        lastUpdatedAt={dataUpdatedAt}
        onClose={handleOutageSheetClose}
      />
      <Text variant="heading3" py="$padding16" px="$spacing24">
        {t('common.activity')}
      </Text>
      <ActivityContent
        isExternalProfile={activeAccount.type === AccountType.Readonly}
        containerProps={containerProps}
        owner={activeAccount.address}
        onErrorStateChange={handleErrorStateChange}
      />
    </Screen>
  )
}
