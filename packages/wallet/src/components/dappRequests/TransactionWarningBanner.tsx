import type { ColorTokens } from '@universe/mycelium'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { LabeledCheckboxCompat as LabeledCheckbox } from '@universe/mycelium/checkbox-compat'
import type { IconProps } from '@universe/mycelium/icons'
import { AlertCircleFilled } from '@universe/mycelium/icons/AlertCircleFilled'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { OctagonExclamation } from '@universe/mycelium/icons/OctagonExclamation'
import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultHitslop } from 'ui/src/theme/sizing'
import { PoweredByBlockaid } from 'uniswap/src/components/logos/PoweredByBlockaid'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappScanInfoModal } from 'wallet/src/components/dappRequests/DappScanInfoModal'
import { TransactionErrorType, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

interface RiskConfig {
  title: (t: TFunction) => string
  description: (t: TFunction) => string
  color: ColorTokens
  icon: React.ComponentType<IconProps>
}

const RISK_LEVEL_CONFIG: Record<TransactionRiskLevel.Critical | TransactionRiskLevel.Warning, RiskConfig> = {
  [TransactionRiskLevel.Critical]: {
    title: (t) => t('dapp.request.malicious.title'),
    description: (t) => t('dapp.request.pending.threat.description'),
    color: '$statusCritical',
    icon: OctagonExclamation,
  },
  [TransactionRiskLevel.Warning]: {
    title: (t) => t('dapp.request.unverified.title'),
    description: (t) => t('dapp.request.pending.unverified.description'),
    color: '$statusWarning',
    icon: AlertTriangleFilled,
  },
}

interface TransactionWarningBannerProps {
  riskLevel: TransactionRiskLevel
  confirmedRisk?: boolean
  onConfirmRisk?: (confirmed: boolean) => void
  /**
   * When set, the request could not be usably scanned. The banner shows a "couldn't verify" warning
   * instead of a malicious verdict, and takes precedence over `riskLevel` for the copy and styling it
   * renders. `ScanUnavailable` is a permanent failure (gated behind an acknowledgement); `ScanFailed`
   * is a transient one (informational, no gate). Both share the same warning treatment.
   */
  scanFailureError?: TransactionErrorType
}

interface BannerConfig {
  color: ColorTokens
  icon: React.ComponentType<IconProps>
  title: string
  description: string
}

export function TransactionWarningBanner({
  riskLevel,
  confirmedRisk,
  onConfirmRisk,
  scanFailureError,
}: TransactionWarningBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const { value: isInfoModalOpen, setTrue: openInfoModal, setFalse: closeInfoModal } = useBooleanState(false)

  const handleConfirmRisk = useCallback(
    (currentlyChecked: boolean) => {
      onConfirmRisk?.(!currentlyChecked)
    },
    [onConfirmRisk],
  )

  const config = useMemo<BannerConfig | null>(() => {
    // A scan failure is unverifiable, not known-malicious: render it as a "couldn't verify" warning
    // with no Blockaid attribution, and let it win over whatever risk level is threaded in. Permanent
    // and transient failures share the amber treatment; only the acknowledgement gate differs.
    if (scanFailureError) {
      return {
        color: '$statusWarning',
        icon: AlertTriangleFilled,
        title: t('dapp.request.scanIncomplete.title'),
        description: t('dapp.request.scanIncomplete.description'),
      }
    }
    if (riskLevel === TransactionRiskLevel.None) {
      return null
    }
    const riskConfig = RISK_LEVEL_CONFIG[riskLevel]
    return {
      color: riskConfig.color,
      icon: riskConfig.icon,
      title: riskConfig.title(t),
      description: riskConfig.description(t),
    }
  }, [scanFailureError, riskLevel, t])

  // Don't render if there is nothing to warn about
  if (!config) {
    return null
  }

  // A genuine critical Blockaid verdict keeps its red treatment and attribution; a scan failure
  // borrows the acknowledgement flow but stays an amber warning.
  const isCriticalVerdict = !scanFailureError && riskLevel === TransactionRiskLevel.Critical
  // Only a permanent scan failure (retry can't help) is gated behind an acknowledgement; a transient
  // one is an informational caution, so it shows without a checkbox and leaves confirmation enabled.
  const isPermanentScanFailure = scanFailureError === TransactionErrorType.ScanUnavailable
  const Icon = config.icon
  const backgroundColor = isCriticalVerdict ? '$statusCritical2' : '$surface2'
  const showRiskCheckbox = Boolean(onConfirmRisk) && (isPermanentScanFailure || isCriticalVerdict)

  return (
    <>
      <Flex gap="$spacing4">
        <Flex
          row
          backgroundColor={backgroundColor}
          borderRadius="$rounded12"
          p="$spacing12"
          gap="$spacing12"
          justifyContent="space-between"
        >
          <Flex row gap="$spacing12" flex={1} flexShrink={1}>
            <Icon color={config.color} size="$icon.20" flexShrink={0} />
            <Flex gap="$spacing2" flex={1} flexShrink={1}>
              <Text color={config.color} variant="buttonLabel3">
                {config.title}
              </Text>
              <Text color="$neutral2" variant="body3" textWrap="wrap">
                {config.description}
              </Text>

              {isCriticalVerdict && (
                <Flex row pt="$spacing8">
                  <PoweredByBlockaid />
                </Flex>
              )}
            </Flex>
          </Flex>

          {/* Info icon to learn more — only for a real Blockaid verdict; a scan-failure caution has
              no preview to explain. */}
          {!scanFailureError && (
            <TouchableArea hitSlop={defaultHitslop} onPress={openInfoModal}>
              <AlertCircleFilled color="$neutral3" size="$icon.20" flexShrink={0} />
            </TouchableArea>
          )}
        </Flex>

        {showRiskCheckbox && (
          <Flex backgroundColor={backgroundColor} borderRadius="$rounded12" p="$spacing12">
            <LabeledCheckbox
              checked={Boolean(confirmedRisk)}
              checkboxPosition="start"
              gap="$spacing8"
              size="$icon.16"
              px="$none"
              text={
                <Text color="$neutral1" flexShrink={1} variant="body3">
                  {scanFailureError
                    ? t('dapp.request.scanIncomplete.confirmationText')
                    : t('dapp.request.pending.threat.confirmationText')}
                </Text>
              }
              onCheckPressed={handleConfirmRisk}
            />
          </Flex>
        )}
      </Flex>

      <DappScanInfoModal
        isOpen={isInfoModalOpen}
        title={t('dapp.transaction.preview')}
        description={t('dapp.transaction.preview.description')}
        onClose={closeInfoModal}
      />
    </>
  )
}
