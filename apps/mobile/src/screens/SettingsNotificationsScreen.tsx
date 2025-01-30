import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { useNotificationToggle } from 'src/features/notifications/hooks/useNotificationsToggle'
import { Flex, Switch, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAccountsList } from 'wallet/src/features/wallet/hooks'

export function SettingsNotificationsScreen(): JSX.Element {
  const { t } = useTranslation()

  const accounts = useAccountsList()

  return (
    <Screen>
      <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
        <Text variant="body1">{t('settings.setting.notifications.title')}</Text>
      </BackHeader>

      <Flex py="$spacing20" px="$spacing24">
        <Flex pb="$spacing12">
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
                <NotificationsSwitch address={account.address} />
              </Flex>
            )
          })}
        </Flex>
      </Flex>
    </Screen>
  )
}

function onPermissionChanged(enabled: boolean): void {
  sendAnalyticsEvent(MobileEventName.NotificationsToggled, { enabled })
}

function _NotificationsSwitch({ address }: { address: string }): JSX.Element {
  const { isEnabled, isPending, toggle } = useNotificationToggle({
    address,
    onPermissionChanged,
  })

  return <Switch checked={isEnabled} disabled={isPending} variant="branded" onCheckedChange={toggle} />
}
const NotificationsSwitch = memo(_NotificationsSwitch)
