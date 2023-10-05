import { SwapEventName } from '@uniswap/analytics-events'
import React, { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountDetails } from 'src/components/accounts/AccountDetails'
import { Warning } from 'src/components/modals/WarningModal/types'
import { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NetworkFee } from 'src/components/Network/NetworkFee'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { FeeOnTransferInfo } from 'src/features/transactions/swap/FeeOnTransferInfo'
import { Box, Flex, Icons, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import AnglesMaximize from 'ui/src/assets/icons/angles-maximize.svg'
import AnglesMinimize from 'ui/src/assets/icons/angles-minimize.svg'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: ChainId
  gasFee: GasFeeResult
  showExpandedChildren?: boolean
  showWarning?: boolean
  warning?: Warning
  feeOnTransferInfo?: FeeOnTransferInfo
  onShowNetworkFeeInfo: () => void
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
  onShowNetworkFeeInfo,
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
    <Flex>
      {showWarning && warning && onShowWarning && (
        <TouchableArea mb="$spacing8" onPress={onShowWarning}>
          <Flex
            grow
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderRadius="$rounded16"
            gap="$spacing8"
            px="$spacing16"
            py="$spacing8">
            <Icons.AlertTriangle color={warningColor?.text} size="$icon.16" />
            <Flex grow py="$spacing2">
              <Text color={warningColor.text} variant="body3">
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
      <Flex backgroundColor="$surface2" borderRadius="$rounded16">
        {!showWarning && (
          <>
            {banner}
            <Separator />
          </>
        )}
        <Flex gap="$spacing12" pb="$spacing12" pt={banner ? '$none' : '$spacing12'} px="$spacing12">
          {showChildren ? <Flex gap="$spacing12">{children}</Flex> : null}
          {feeOnTransferInfo && <FeeOnTransferInfo {...feeOnTransferInfo} />}
          <NetworkFee
            chainId={chainId}
            gasFee={gasFee}
            onShowNetworkFeeInfo={onShowNetworkFeeInfo}
          />
        </Flex>
        <Separator />
        <Flex px="$spacing12" py="$spacing12">
          <AccountDetails address={userAddress} iconSize={iconSizes.icon20} />
        </Flex>
      </Flex>
      {children ? (
        <TouchableArea
          alignItems="center"
          flexDirection="row"
          justifyContent="center"
          pt="$spacing12"
          onPress={onPressToggleShowChildren}>
          <Text color="$neutral3" variant="body3">
            {showChildren ? t('Show less') : t('Show more')}
          </Text>
          {showChildren ? (
            <AnglesMinimize
              color={colors.neutral3.get()}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          ) : (
            <AnglesMaximize
              color={colors.neutral3.get()}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
