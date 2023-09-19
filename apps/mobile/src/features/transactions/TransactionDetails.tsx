import { SwapEventName } from '@uniswap/analytics-events'
import React, { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Warning } from 'src/components/modals/WarningModal/types'
import { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { FeeOnTransferInfo } from 'src/features/transactions/swap/FeeOnTransferInfo'
import { Box, Flex, Separator, Text, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import AnglesMaximize from 'ui/src/assets/icons/angles-maximize.svg'
import AnglesMinimize from 'ui/src/assets/icons/angles-minimize.svg'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const ALERT_ICONS_SIZE = 18

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: ChainId
  gasFee: GasFeeResult
  showExpandedChildren?: boolean
  showWarning?: boolean
  warning?: Warning
  feeOnTransferInfo?: FeeOnTransferInfo
  onShowWarning?: () => void
}

export function TransactionDetails({
  banner,
  children,
  showExpandedChildren,
  chainId,
  gasFee,
  showWarning,
  warning,
  feeOnTransferInfo,
  onShowWarning,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const userAddress = useActiveAccountAddressWithThrow()
  const warningColor = getAlertColor(warning?.severity)

  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendMobileAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

  return (
    <Flex gap="$none">
      {showWarning && warning && onShowWarning && (
        <TouchableArea mb="spacing8" onPress={onShowWarning}>
          <Flex
            grow
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderRadius="$rounded16"
            gap="$spacing8"
            px="$spacing16"
            py="$spacing8">
            <AlertTriangle
              color={warningColor?.text}
              height={ALERT_ICONS_SIZE}
              width={ALERT_ICONS_SIZE}
            />
            <Flex grow py="$spacing2">
              <Text color={warningColor.text} variant="subheadSmall">
                {warning.title}
              </Text>
            </Flex>
          </Flex>
        </TouchableArea>
      )}
      {gasFee.error && (
        <Box
          backgroundColor="$DEP_accentCriticalSoft"
          borderRadius="$rounded16"
          mb="$spacing12"
          p="$spacing12">
          <Text color="$statusCritical">{t('This transaction is expected to fail')}</Text>
        </Box>
      )}
      <Flex backgroundColor="$surface2" borderRadius="$rounded16" gap="$none">
        {!showWarning && (
          <>
            {banner}
            <Separator borderColor="$surface2" width={1} />
          </>
        )}
        <Flex gap="$spacing12" pt={banner ? '$none' : '$spacing8'} px="$spacing12">
          {showChildren ? <Flex gap="$spacing12">{children}</Flex> : null}
          {feeOnTransferInfo && <FeeOnTransferInfo {...feeOnTransferInfo} />}
          <NetworkFee chainId={chainId} gasFee={gasFee} />
        </Flex>
        <Separator borderColor="$surface2" width={1} />
        <Flex gap="$none" px="$spacing12" py="$spacing12">
          <AccountDetails address={userAddress} iconSize={iconSizes.icon20} />
        </Flex>
      </Flex>
      {children ? (
        <TouchableArea
          alignItems="center"
          flexDirection="row"
          justifyContent="center"
          py="spacing8"
          onPress={onPressToggleShowChildren}>
          <Text color="$neutral3" variant="bodySmall">
            {showChildren ? t('Show less') : t('Show more')}
          </Text>
          {showChildren ? (
            <AnglesMinimize
              color={colors.neutral3.val}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          ) : (
            <AnglesMaximize
              color={colors.neutral3.val}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
