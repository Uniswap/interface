import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LabeledCheckbox, Text, TouchableArea } from 'ui/src'
import {
  AlertCircleFilled,
  AlertTriangleFilled,
  CheckCircleFilled,
  Clear,
  GlobeFilled,
  OctagonExclamation,
  RotatableChevron,
} from 'ui/src/components/icons'
import { defaultHitslop, iconSizes } from 'ui/src/theme'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappScanInfoModal } from 'wallet/src/components/dappRequests/DappScanInfoModal'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

export function DappConnectionPermissions({
  verificationStatus,
  confirmedWarning,
  onConfirmWarning,
}: {
  verificationStatus?: DappVerificationStatus
  confirmedWarning?: boolean
  onConfirmWarning?: (confirmed: boolean) => void
}): JSX.Element {
  const { t } = useTranslation()

  // Always show expanded permissions for unverified apps
  const isInitiallyExpanded = verificationStatus !== DappVerificationStatus.Verified

  const { value: isExpanded, toggle: toggleExpanded } = useBooleanState(isInitiallyExpanded)
  const { value: isInfoModalOpen, setTrue: openInfoModal, setFalse: closeInfoModal } = useBooleanState(false)

  const infoTextSize = 'body3'

  const handleConfirmWarning = useCallback(
    (currentlyChecked: boolean) => {
      onConfirmWarning?.(!currentlyChecked)
    },
    [onConfirmWarning],
  )

  return (
    <Flex gap="$spacing12">
      <Flex
        backgroundColor="$surface2"
        borderColor={verificationStatus === DappVerificationStatus.Threat ? '$statusCritical' : '$surface3'}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        minHeight={44}
      >
        <TouchableArea
          pb="$spacing12"
          p="$spacing16"
          borderBottomWidth={isExpanded ? 1 : 0}
          borderRadius={0}
          borderColor="$surface3"
          onPress={toggleExpanded}
        >
          <Flex centered row justifyContent="space-between">
            <Flex centered row gap="$spacing8">
              <GlobeFilled color="$neutral2" size="$icon.16" />
              <Text $short={{ variant: 'body3' }} allowFontScaling={false} color="$neutral2" variant="buttonLabel3">
                {t('dapp.request.permissions.title')}
              </Text>
            </Flex>
            <RotatableChevron
              color="$neutral2"
              direction={isExpanded ? 'up' : 'down'}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          </Flex>
        </TouchableArea>

        {isExpanded && (
          <Flex gap="$spacing12" p="$spacing16">
            <Flex centered row gap="$spacing8">
              <CheckCircleFilled color="$statusSuccess" size="$icon.16" />
              <Text
                $short={{ variant: infoTextSize }}
                allowFontScaling={false}
                color="$neutral2"
                flexGrow={1}
                variant={infoTextSize}
              >
                {t('dapp.request.permissions.viewTokenBalances')}
              </Text>
            </Flex>
            <Flex centered row gap="$spacing8">
              <CheckCircleFilled color="$statusSuccess" size="$icon.16" />
              <Text
                $short={{ variant: infoTextSize }}
                allowFontScaling={false}
                color="$neutral2"
                flexGrow={1}
                variant={infoTextSize}
              >
                {t('dapp.request.permissions.requestApprovals')}
              </Text>
            </Flex>
            <Flex centered row gap="$spacing8">
              <Clear color="$statusCritical" size="$icon.16" />
              <Text
                $short={{ variant: infoTextSize }}
                allowFontScaling={false}
                color="$neutral2"
                flexGrow={1}
                variant={infoTextSize}
              >
                {t('dapp.request.permissions.transferAssets')}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>

      {verificationStatus === DappVerificationStatus.Unverified && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" justifyContent="space-between">
          <Flex row gap="$spacing12" flex={1} flexShrink={1}>
            <AlertTriangleFilled color="$statusWarning" size="$icon.20" flexShrink={0} />
            <Flex gap="$spacing8" flex={1} flexShrink={1}>
              <Text color="$statusWarning" variant="buttonLabel3">
                {t('dapp.request.pending.unverified.title')}
              </Text>
              <Text color="$neutral2" variant="body3" textWrap="wrap">
                {t('dapp.request.pending.unverified.description')}
              </Text>
            </Flex>
          </Flex>
          <TouchableArea hitSlop={defaultHitslop} onPress={openInfoModal}>
            <AlertCircleFilled color="$neutral3" size="$icon.20" flexShrink={0} />
          </TouchableArea>
        </Flex>
      )}

      {verificationStatus === DappVerificationStatus.Threat && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" justifyContent="space-between">
          <Flex row gap="$spacing12" flex={1} flexShrink={1}>
            <OctagonExclamation color="$statusCritical" size="$icon.20" flexShrink={0} />
            <Flex gap="$spacing8" flex={1} flexShrink={1}>
              <Text color="$statusCritical" variant="buttonLabel3">
                {t('dapp.request.pending.threat.title')}
              </Text>
              <Text color="$neutral2" variant="body3" textWrap="wrap">
                {t('dapp.request.pending.threat.description')}
              </Text>
              <LabeledCheckbox
                checked={Boolean(confirmedWarning)}
                checkboxPosition="start"
                gap="$spacing8"
                size="$icon.16"
                px="$none"
                text={
                  <Text color="$neutral2" flexShrink={1} variant="body3">
                    {t('dapp.request.pending.threat.confirmationText')}
                  </Text>
                }
                onCheckPressed={handleConfirmWarning}
              />
            </Flex>
          </Flex>
          <TouchableArea hitSlop={defaultHitslop} onPress={openInfoModal}>
            <AlertCircleFilled color="$neutral3" size="$icon.20" flexShrink={0} />
          </TouchableArea>
        </Flex>
      )}

      <DappScanInfoModal
        isOpen={isInfoModalOpen}
        title={t('dapp.request.scanInfo.title')}
        description={t('dapp.request.scanInfo.description')}
        onClose={closeInfoModal}
      />
    </Flex>
  )
}
