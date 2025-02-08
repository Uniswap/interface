import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { NotifSettingType } from 'src/features/notifications/constants'
import {
  useAddressNotificationToggle,
  useSettingNotificationToggle,
} from 'src/features/notifications/hooks/useNotificationsToggle'
import { Flex, Switch, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccountsList } from 'wallet/src/features/wallet/hooks'

export function SettingsNotificationsScreen(): JSX.Element {
  const { t } = useTranslation()

  const accounts = useAccountsList()

  const priceAlertsToggleEnabled = useFeatureFlag(FeatureFlags.NotificationPriceAlerts)

  const { isEnabled: updatesNotifEnabled, toggle: toggleUpdatesNotif } = useSettingNotificationToggle({
    type: NotifSettingType.GeneralUpdates,
  })
  const { isEnabled: priceAlertsNotifEnabled, toggle: togglePriceAlertsNotif } = useSettingNotificationToggle({
    type: NotifSettingType.PriceAlerts,
  })

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Text variant="body1">{t('settings.setting.notifications.title')}</Text>
      </BackHeader>

      <Flex py="$spacing20" px="$spacing24" gap="$spacing24">
        <NotificationSettingRow
          title={t('settings.setting.notifications.row.updates.title')}
          description={t('settings.setting.notifications.row.updates.description')}
          checked={updatesNotifEnabled}
          onCheckedChange={toggleUpdatesNotif}
        />

        {priceAlertsToggleEnabled ? (
          <NotificationSettingRow
            title={t('settings.setting.notifications.row.priceAlerts.title')}
            description={t('settings.setting.notifications.row.priceAlerts.description')}
            checked={priceAlertsNotifEnabled}
            onCheckedChange={togglePriceAlertsNotif}
          />
        ) : undefined}

        <Flex gap="$spacing12">
          <Flex gap="$spacing4">
            <Text variant="subheading2" color="$neutral1">
              {t('settings.setting.notifications.row.activity.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('settings.setting.notifications.row.activity.description')}
            </Text>
          </Flex>

          <Flex gap="$spacing12">
            {accounts.map((account) => {
              const isViewOnly = account.type === AccountType.Readonly
              return (
                <Flex key={account.address} row gap="$spacing12">
                  <Flex fill>
                    <AddressDisplay
                      showIconBackground
                      address={account.address}
                      showViewOnlyBadge={isViewOnly}
                      showViewOnlyLabel={isViewOnly}
                      size={iconSizes.icon32}
                      variant="subheading2"
                      captionVariant="body3"
                    />
                  </Flex>
                  <AddressNotificationsSwitch address={account.address} />
                </Flex>
              )
            })}
          </Flex>
        </Flex>
      </Flex>
    </Screen>
  )
}

function NotificationSettingRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <Flex row gap="$spacing12">
      <Flex fill gap="$spacing4">
        <Text variant="subheading2" color="$neutral1">
          {title}
        </Text>
        <Text variant="body3" color="$neutral2">
          {description}
        </Text>
      </Flex>
      <Switch variant="branded" checked={checked} onCheckedChange={onCheckedChange} />
    </Flex>
  )
}

function onPermissionChanged(enabled: boolean): void {
  sendAnalyticsEvent(MobileEventName.NotificationsToggled, { enabled })
}

function _AddressNotificationsSwitch({ address }: { address: string }): JSX.Element {
  const { isEnabled, isPending, toggle } = useAddressNotificationToggle({
    address,
    onToggle: onPermissionChanged,
  })

  return <Switch checked={isEnabled} disabled={isPending} variant="branded" onCheckedChange={toggle} />
}
const AddressNotificationsSwitch = memo(_AddressNotificationsSwitch)
