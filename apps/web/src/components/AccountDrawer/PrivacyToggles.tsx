import { Flex, Text } from '@universe/mycelium'
import { Fingerprint } from '@universe/mycelium/icons/Fingerprint'
import { LineChartDots } from '@universe/mycelium/icons/LineChartDots'
import { useTranslation } from 'react-i18next'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { SettingsToggle } from '~/components/AccountDrawer/SettingsToggle'
import {
  AnalyticsInfoTooltip,
  ShareDeviceIdentifiersInfoTooltip,
  useAllowAnalyticsSetting,
  useShareDeviceIdentifiersSetting,
} from '~/components/PrivacyChoices/PrivacySettings'

// 8px around the 32px switch keeps these rows at the 48px of the drawer's button rows.
const SWITCH_ROW_PY = '$padding8'

function ToggleTitle({ title, info }: { title: string; info: JSX.Element }) {
  return (
    <Flex row gap="$gap8" alignItems="center">
      <Text variant="subheading2" color="$neutral1">
        {title}
      </Text>
      {info}
    </Flex>
  )
}

export function PrivacyToggles() {
  const { t } = useTranslation()
  const { allowAnalytics, toggleAllowAnalytics } = useAllowAnalyticsSetting()
  const { shareDeviceIdentifiers, toggleShareDeviceIdentifiers } = useShareDeviceIdentifiersSetting()
  const accountDrawer = useAccountDrawer()

  return (
    <>
      <SettingsToggle
        py={SWITCH_ROW_PY}
        icon={<LineChartDots size="$icon.24" color="$neutral2" />}
        title={<ToggleTitle title={t('analytics.allow')} info={<AnalyticsInfoTooltip />} />}
        isActive={allowAnalytics}
        toggle={toggleAllowAnalytics}
      />
      <SettingsToggle
        py={SWITCH_ROW_PY}
        icon={<Fingerprint size="$icon.24" color="$neutral2" />}
        title={
          <ToggleTitle
            title={t('settings.setting.shareDeviceIdentifiers.title')}
            info={<ShareDeviceIdentifiersInfoTooltip onLearnMore={accountDrawer.close} />}
          />
        }
        isActive={shareDeviceIdentifiers}
        toggle={toggleShareDeviceIdentifiers}
      />
    </>
  )
}
