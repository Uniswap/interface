import { FlashList, ListRenderItem } from '@shopify/flash-list'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { NotifSettingType } from 'src/features/notifications/constants'
import {
  useAddressNotificationToggle,
  useSettingNotificationToggle,
} from 'src/features/notifications/hooks/useNotificationsToggle'
import { Flex, Switch, Text } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NotificationToggleLoggingType } from 'uniswap/src/features/telemetry/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useAccountsList } from 'wallet/src/features/wallet/hooks'

const ROW_ITEM_HEIGHT = 40

enum NotificationItemType {
  Setting = 'setting',
  Account = 'account',
}

type AccountItem = {
  type: NotificationItemType.Account
  address: string
  isViewOnly: boolean
}

type SettingItem = {
  type: NotificationItemType.Setting
  title: string
  description: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

type NotificationItem = SettingItem | AccountItem

function _SettingsNotificationsScreen(): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const { fullWidth, fullHeight } = useDeviceDimensions()
  const accounts = useAccountsList()

  const onGeneralUpdatesToggle = useCallback(
    (enabled: boolean) => onPermissionChanged(enabled, NotifSettingType.GeneralUpdates),
    [],
  )

  const { isEnabled: updatesNotifEnabled, toggle: toggleUpdatesNotif } = useSettingNotificationToggle({
    type: NotifSettingType.GeneralUpdates,
    onToggle: onGeneralUpdatesToggle,
  })

  const data: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = [
      {
        type: NotificationItemType.Setting,
        title: t('settings.setting.notifications.row.updates.title'),
        description: t('settings.setting.notifications.row.updates.description'),
        checked: updatesNotifEnabled,
        onCheckedChange: toggleUpdatesNotif,
      },
    ]

    // Add a title item for the accounts section
    items.push({
      type: NotificationItemType.Setting,
      title: t('settings.setting.notifications.row.activity.title'),
      description: t('settings.setting.notifications.row.activity.description'),
    })

    // Add account items
    accounts.forEach((account) => {
      items.push({
        type: NotificationItemType.Account,
        address: account.address,
        isViewOnly: account.type === AccountType.Readonly,
      })
    })

    return items
  }, [t, updatesNotifEnabled, toggleUpdatesNotif, accounts])

  const estimatedListSize = useMemo(() => {
    return {
      height: fullHeight,
      width: fullWidth,
    }
  }, [fullHeight, fullWidth])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: insets.bottom - spacing.spacing16,
      paddingTop: spacing.spacing12,
      paddingHorizontal: spacing.spacing24,
    }
  }, [insets])

  return (
    <ScreenWithHeader centerElement={<Text variant="body1">{t('settings.setting.notifications.title')}</Text>}>
      <FlashList
        data={data}
        renderItem={renderItem}
        estimatedItemSize={ROW_ITEM_HEIGHT}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        estimatedListSize={estimatedListSize}
        keyExtractor={keyExtractor}
      />
    </ScreenWithHeader>
  )
}

export const SettingsNotificationsScreen = memo(_SettingsNotificationsScreen)

SettingsNotificationsScreen.displayName = 'SettingsNotificationsScreen'

const keyExtractor = (_item: NotificationItem, index: number): string => 'notification' + index

const renderItem: ListRenderItem<NotificationItem> = ({ item }) => {
  switch (item.type) {
    case NotificationItemType.Setting:
      return (
        <NotificationSettingsRow
          title={item.title}
          description={item.description}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
        />
      )
    case NotificationItemType.Account:
      return <AccountNotificationRow address={item.address} isViewOnly={item.isViewOnly} />
    default:
      return null
  }
}

interface NotificationSettingsRowProps {
  title: string
  description: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const NotificationSettingsRow = memo(function NotificationSettingsRow({
  title,
  description,
  checked,
  onCheckedChange,
}: NotificationSettingsRowProps): JSX.Element {
  return (
    <Flex row gap="$spacing12" py="$spacing12">
      <Flex fill gap="$spacing4">
        <Text variant="subheading2" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {description}
        </Text>
      </Flex>
      {onCheckedChange && <Switch variant="branded" checked={checked} onCheckedChange={onCheckedChange} />}
    </Flex>
  )
})

NotificationSettingsRow.displayName = 'NotificationSettingsRow'

interface AccountNotificationRowProps {
  address: string
  isViewOnly: boolean
}

const AccountNotificationRow = memo(function AccountNotificationRow({
  address,
  isViewOnly,
}: AccountNotificationRowProps): JSX.Element {
  return (
    <Flex row gap="$spacing12" py="$spacing12">
      <Flex fill>
        <AddressDisplay
          showIconBackground
          address={address}
          showViewOnlyBadge={isViewOnly}
          size={iconSizes.icon32}
          variant="subheading2"
          captionVariant="body3"
        />
      </Flex>
      <AddressNotificationsSwitch address={address} />
    </Flex>
  )
})

AccountNotificationRow.displayName = 'AccountNotificationRow'

function onPermissionChanged(enabled: boolean, type: NotificationToggleLoggingType): void {
  sendAnalyticsEvent(MobileEventName.NotificationsToggled, { enabled, type })
}

const PENDING_DELAY = 100

function _AddressNotificationsSwitch({ address }: { address: string }): JSX.Element {
  const { isEnabled, isPending, toggle } = useAddressNotificationToggle({
    address,
    onToggle: (enabled) => onPermissionChanged(enabled, 'wallet_activity'),
  })

  // we do this to prevent the switch from flashing when
  // the toggle is pending for very short periods of time
  const [showDisabled, setShowDisabled] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (isPending) {
      timeoutId = setTimeout(() => {
        setShowDisabled(true)
      }, PENDING_DELAY)
    } else {
      setShowDisabled(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isPending])

  return <Switch checked={isEnabled} disabled={showDisabled} variant="branded" onCheckedChange={toggle} />
}
const AddressNotificationsSwitch = memo(_AddressNotificationsSwitch)

AddressNotificationsSwitch.displayName = 'AddressNotificationsSwitch'
