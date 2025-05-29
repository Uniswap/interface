import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { WalletConnectVerifyStatus } from 'src/features/walletConnect/walletConnectSlice'
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
import { iconSizes } from 'ui/src/theme'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const PERMISSIONS_MAX_LENGTH = 280

export const SitePermissions = ({
  verifyStatus,
  confirmedWarning,
  onConfirmWarning,
}: {
  verifyStatus: WalletConnectVerifyStatus
  confirmedWarning?: boolean
  onConfirmWarning?: (confirmed: boolean) => void
}): JSX.Element => {
  const { t } = useTranslation()

  // Always show expanded permissions for unverified apps
  const isInitiallyExpanded = verifyStatus !== WalletConnectVerifyStatus.Verified

  const { value: isExpanded, toggle: toggleExpanded, setValue: setIsExpanded } = useBooleanState(isInitiallyExpanded)

  const infoTextSize = 'body3'

  const handleConfirmWarning = useCallback(
    (previousIsConfirmed: boolean) => {
      onConfirmWarning?.(!previousIsConfirmed)
      // Open options if previously confirmed, close if previously unconfirmed
      setIsExpanded(previousIsConfirmed ? true : false)
    },
    [onConfirmWarning, setIsExpanded],
  )

  return (
    <Flex gap="$spacing12">
      <Flex
        backgroundColor="$surface2"
        borderColor={verifyStatus === WalletConnectVerifyStatus.Threat ? '$statusCritical' : '$surface3'}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        minHeight={44}
      >
        <TouchableArea
          pb="$spacing12"
          p="$spacing16"
          borderBottomWidth={isExpanded ? 1 : 0}
          borderColor="$surface3"
          onPress={toggleExpanded}
        >
          <Flex centered row justifyContent="space-between">
            <Flex centered row gap="$spacing8">
              <GlobeFilled color="$neutral2" size="$icon.16" />
              <Text $short={{ variant: 'body3' }} allowFontScaling={false} color="$neutral2" variant="buttonLabel3">
                {t('walletConnect.permissions.title')}
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
                {t('walletConnect.permissions.option.viewTokenBalances')}
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
                {t('walletConnect.permissions.option.requestApprovals')}
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
                {t('walletConnect.permissions.option.transferAssets')}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>

      {verifyStatus === WalletConnectVerifyStatus.Unverified && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" justifyContent="space-between">
          <Flex row gap="$spacing12">
            <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
            <Flex gap="$spacing8" maxWidth={PERMISSIONS_MAX_LENGTH}>
              <Text color="$statusWarning" variant="buttonLabel3">
                {t('walletConnect.pending.unverified.title')}
              </Text>
              <Text color="$neutral2" variant="body3" textWrap="wrap">
                {t('walletConnect.pending.unverified.description')}
              </Text>
            </Flex>
          </Flex>
          <AlertCircleFilled color="$neutral3" size="$icon.20" />
        </Flex>
      )}

      {verifyStatus === WalletConnectVerifyStatus.Threat && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12" justifyContent="space-between">
          <Flex row gap="$spacing12">
            <OctagonExclamation color="$statusCritical" size="$icon.20" />
            <Flex gap="$spacing8" maxWidth={PERMISSIONS_MAX_LENGTH}>
              <Text color="$statusCritical" variant="buttonLabel3">
                {t('walletConnect.pending.threat.title')}
              </Text>
              <Text color="$neutral2" variant="body3" textWrap="wrap">
                {t('walletConnect.pending.threat.description')}
              </Text>
              <LabeledCheckbox
                checked={Boolean(confirmedWarning)}
                checkboxPosition="start"
                gap="$spacing8"
                size="$icon.16"
                px="$none"
                text={
                  <Text color="$neutral2" flexShrink={1} variant="body3">
                    {t('walletConnect.pending.threat.confirmationText')}
                  </Text>
                }
                onCheckPressed={handleConfirmWarning}
              />
            </Flex>
          </Flex>
          <AlertCircleFilled color="$neutral3" size="$icon.20" />
        </Flex>
      )}
    </Flex>
  )
}
