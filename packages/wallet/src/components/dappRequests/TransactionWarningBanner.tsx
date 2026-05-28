import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColorTokens, IconProps } from 'ui/src'
import { Flex, LabeledCheckbox, Text, TouchableArea } from 'ui/src'
import { AlertCircleFilled, AlertTriangleFilled, OctagonExclamation } from 'ui/src/components/icons'
import { defaultHitslop } from 'ui/src/theme'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappScanInfoModal } from 'wallet/src/components/dappRequests/DappScanInfoModal'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

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
}

export function TransactionWarningBanner({
  riskLevel,
  confirmedRisk,
  onConfirmRisk,
}: TransactionWarningBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const { value: isInfoModalOpen, setTrue: openInfoModal, setFalse: closeInfoModal } = useBooleanState(false)

  const handleConfirmRisk = useCallback(
    (currentlyChecked: boolean) => {
      onConfirmRisk?.(!currentlyChecked)
    },
    [onConfirmRisk],
  )

  const { config, title, description } = useMemo(() => {
    if (riskLevel === TransactionRiskLevel.None) {
      return { config: null, title: undefined, description: undefined }
    }
    const riskConfig = RISK_LEVEL_CONFIG[riskLevel]
    return {
      config: riskConfig,
      title: riskConfig.title(t),
      description: riskConfig.description(t),
    }
  }, [riskLevel, t])

  const isCritical = riskLevel === TransactionRiskLevel.Critical

  // Don't render if no risk
  if (!config) {
    return null
  }

  const Icon = config.icon

  return (
    <>
      <Flex
        row
        backgroundColor="$surface2"
        borderRadius="$rounded12"
        p="$spacing12"
        gap="$spacing12"
        justifyContent="space-between"
      >
        <Flex row gap="$spacing12" flex={1} flexShrink={1}>
          <Icon color={config.color} size="$icon.20" flexShrink={0} />
          <Flex gap="$spacing2" flex={1} flexShrink={1}>
            <Text color={config.color} variant="buttonLabel3">
              {title}
            </Text>
            <Text color="$neutral2" variant="body3" textWrap="wrap">
              {description}
            </Text>

            {/* Show checkbox for critical risks requiring acknowledgment */}
            {isCritical && onConfirmRisk && (
              <Flex pt="$spacing8" pb="$spacing4">
                <LabeledCheckbox
                  checked={Boolean(confirmedRisk)}
                  checkboxPosition="start"
                  gap="$spacing8"
                  size="$icon.16"
                  px="$none"
                  text={
                    <Text color="$neutral2" flexShrink={1} variant="body3">
                      {t('dapp.request.pending.threat.confirmationText')}
                    </Text>
                  }
                  onCheckPressed={handleConfirmRisk}
                />
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Info icon to learn more */}
        <TouchableArea hitSlop={defaultHitslop} onPress={openInfoModal}>
          <AlertCircleFilled color="$neutral3" size="$icon.20" flexShrink={0} />
        </TouchableArea>
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
