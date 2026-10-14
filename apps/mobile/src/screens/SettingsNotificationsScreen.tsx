import {
  Flex,
  Switch,
  Text,
  UniversalList,
  iconSizes,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { NotifSettingType } from 'src/features/notifications/constants'
import {
  useAddressNotificationToggle,
  useSettingNotificationToggle,
} from 'src/features/notifications/hooks/useNotificationsToggle'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NotificationToggleLoggingType } from 'uniswap/src/features/telemetry/types'
import { useBottomScreenGap } from 'uniswap/src/hooks/useBottomScreenGap'
import { useAccountsList } from 'wallet/src/features/wallet/hooks'

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
  /** Stable, translation-independent row id. */
  id: 'updates' | 'priceAlerts' | 'activity'
  title: string
  description: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

type NotificationItem = SettingItem | AccountItem

function SettingsNotificationsScreenInner(): JSX.Element {
  const { t } = useTranslation()
  const { bottomScreenTotalGap } = useBottomScreenGap()
  const accounts = useAccountsList()

  const onGeneralUpdatesToggle = useCallback(
    (enabled: boolean) => onPermissionChanged(enabled, NotifSettingType.GeneralUpdates),
    [],
  )

  const { isEnabled: updatesNotifEnabled, toggle: toggleUpdatesNotif } = useSettingNotificationToggle({
    type: NotifSettingType.GeneralUpdates,
    onToggle: onGeneralUpdatesToggle,
  })

  const onPriceAlertsToggle = useCallback(
    (enabled: boolean) => onPermissionChanged(enabled, NotifSettingType.PriceAlerts),
    [],
  )

  const { isEnabled: priceAlertsNotifEnabled, toggle: togglePriceAlertsNotif } = useSettingNotificationToggle({
    type: NotifSettingType.PriceAlerts,
    onToggle: onPriceAlertsToggle,
  })

  const data: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = [
      {
        type: NotificationItemType.Setting,
        id: 'updates',
        title: t('settings.setting.notifications.row.updates.title'),
        description: t('settings.setting.notifications.row.updates.description'),
        checked: updatesNotifEnabled,
        onCheckedChange: toggleUpdatesNotif,
      },
      {
        type: NotificationItemType.Setting,
        id: 'priceAlerts',
        title: t('settings.setting.notifications.row.priceAlerts.title'),
        description: t('settings.setting.notifications.row.priceAlerts.description'),
        checked: priceAlertsNotifEnabled,
        onCheckedChange: togglePriceAlertsNotif,
      },
    ]

    // Add a title item for the accounts section
    items.push({
      type: NotificationItemType.Setting,
      id: 'activity',
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
  }, [t, updatesNotifEnabled, toggleUpdatesNotif, priceAlertsNotifEnabled, togglePriceAlertsNotif, accounts])

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ className: 'pt-3 px-6', style: { paddingBottom: bottomScreenTotalGap } }),
    [bottomScreenTotalGap],
  )

  return (
    <ScreenWithHeader centerElement={<Text variant="body1">{t('settings.setting.notifications.title')}</Text>}>
      <UniversalList
        contentContainerStyle={contentContainerStyle}
        data={data}
        getItemType={getItemType}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWithHeader>
  )
}

export const SettingsNotificationsScreen = memo(SettingsNotificationsScreenInner)

SettingsNotificationsScreen.displayName = 'SettingsNotificationsScreen'

function keyExtractor(item: NotificationItem): string {
  return item.type === NotificationItemType.Account ? `account-${item.address}` : `setting-${item.id}`
}

function getItemType(item: NotificationItem): string {
  return item.type
}

const renderItem = ({ item }: UniversalListRenderItemInfo<NotificationItem>): JSX.Element | null => {
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
          alignItems="center"
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

function AddressNotificationsSwitchInner({ address }: { address: string }): JSX.Element {
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
const AddressNotificationsSwitch = memo(AddressNotificationsSwitchInner)

AddressNotificationsSwitch.displayName = 'AddressNotificationsSwitch'
