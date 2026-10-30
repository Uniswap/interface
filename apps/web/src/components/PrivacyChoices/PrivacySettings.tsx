import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { InfoCircle } from '@universe/mycelium/icons/InfoCircle'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { ReactNode, useCallback, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
// oxlint-disable-next-line no-restricted-imports -- Direct analytics import needed for toggling analytics settings
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ALLOW_ANALYTICS_ATOM_KEY } from 'utilities/src/telemetry/analytics/constants'
import { parseAllowAnalytics } from 'utilities/src/telemetry/analytics/utils'
import { usePrivacySharingStore } from '~/components/PrivacyChoices/privacySharingStore'
import { useModalState } from '~/hooks/useModalState'

// `analytics.setAllowAnalytics` persists this key, then dispatches `analyticsToggled`.
function subscribeToAnalyticsToggle(onChange: () => void): () => void {
  document.addEventListener('analyticsToggled', onChange)
  return () => document.removeEventListener('analyticsToggled', onChange)
}

function getAllowAnalytics(): boolean {
  try {
    return parseAllowAnalytics(window.localStorage.getItem(ALLOW_ANALYTICS_ATOM_KEY))
  } catch {
    return true
  }
}

export function useAllowAnalyticsSetting(): { allowAnalytics: boolean; toggleAllowAnalytics: () => Promise<void> } {
  const allowAnalytics = useSyncExternalStore(subscribeToAnalyticsToggle, getAllowAnalytics)
  const toggleAllowAnalytics = useCallback(() => analytics.setAllowAnalytics(!allowAnalytics), [allowAnalytics])
  return { allowAnalytics, toggleAllowAnalytics }
}

export function useShareDeviceIdentifiersSetting(): {
  shareDeviceIdentifiers: boolean
  toggleShareDeviceIdentifiers: () => void
} {
  const optOut = usePrivacySharingStore((state) => state.optOut)
  const toggleShareDeviceIdentifiers = usePrivacySharingStore((state) => state.toggleOptOut)
  return { shareDeviceIdentifiers: !optOut, toggleShareDeviceIdentifiers }
}

function InfoTooltip({
  children,
  interactive = false,
  open,
  onOpenChange,
}: {
  children: ReactNode
  interactive?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Tooltip placement="top-end" open={open} onOpenChange={onOpenChange}>
      <Tooltip.Trigger>
        <InfoCircle size="$icon.16" color="$neutral3" />
      </Tooltip.Trigger>
      <Tooltip.Content maxWidth="290px" pointerEvents={interactive ? 'auto' : undefined}>
        {children}
      </Tooltip.Content>
    </Tooltip>
  )
}

export function AnalyticsInfoTooltip() {
  const { t } = useTranslation()
  return (
    <InfoTooltip>
      <Text variant="body3" color="$neutral2">
        {t('analytics.allow.message')}
      </Text>
    </InfoTooltip>
  )
}

export function ShareDeviceIdentifiersInfoTooltip({ onLearnMore }: { onLearnMore?: () => void }) {
  const { t } = useTranslation()
  const { openModal: openPrivacyChoices } = useModalState(ModalName.PrivacyChoices)
  // Controlled so Learn more skips the hover close delay.
  const [isOpen, setIsOpen] = useState(false)
  const handleLearnMore = useCallback(() => {
    setIsOpen(false)
    onLearnMore?.()
    openPrivacyChoices()
  }, [onLearnMore, openPrivacyChoices])
  return (
    <InfoTooltip interactive open={isOpen} onOpenChange={setIsOpen}>
      <Flex gap="$gap4">
        <Text variant="body3" color="$neutral2">
          {t('settings.setting.shareDeviceIdentifiers.message')}
        </Text>
        <TouchableArea onPress={handleLearnMore}>
          <Text variant="buttonLabel3" color="$accent1">
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      </Flex>
    </InfoTooltip>
  )
}
