import { SwapEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import AnglesMaximize from 'ui/src/assets/icons/angles-maximize.svg'
import AnglesMinimize from 'ui/src/assets/icons/angles-minimize.svg'
import { iconSizes } from 'ui/src/theme'
import { getAlertColor } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { NetworkFee } from 'wallet/src/components/network/NetworkFee'
import { ChainId } from 'wallet/src/constants/chains'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import {
  FeeOnTransferFeeGroup,
  FeeOnTransferFeeGroupProps,
} from 'wallet/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { SwapFee } from 'wallet/src/features/transactions/TransactionDetails/SwapFee'
import { Warning } from 'wallet/src/features/transactions/WarningModal/types'
import { SwapFeeInfo } from 'wallet/src/features/transactions/swap/trade/types'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: ChainId
  gasFee: GasFeeResult
  showExpandedChildren?: boolean
  swapFeeInfo?: SwapFeeInfo
  showWarning?: boolean
  warning?: Warning
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  onShowWarning?: () => void
  isSwap?: boolean
  AccountDetails?: JSX.Element
}

export function TransactionDetails({
  banner,
  children,
  showExpandedChildren,
  chainId,
  gasFee,
  swapFeeInfo,
  showWarning,
  warning,
  feeOnTransferProps,
  onShowWarning,
  isSwap,
  AccountDetails,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const warningColor = getAlertColor(warning?.severity)

  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendWalletAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

  const displaySwapFeeInfo = isSwap && swapFeeInfo

  return (
    <Flex>
      {showWarning && warning && onShowWarning && (
        <TouchableArea mb="$spacing8" onPress={onShowWarning}>
          <Flex
            row
            alignItems="center"
            backgroundColor={warningColor.background}
            borderRadius="$rounded16"
            gap="$spacing8"
            px="$spacing16"
            py="$spacing8">
            <Icons.AlertTriangle color={warningColor?.text} size="$icon.16" />
            <Flex fill py="$spacing2">
              <Text color={warningColor.text} variant="body3">
                {warning.title}
              </Text>
            </Flex>
          </Flex>
        </TouchableArea>
      )}
      {gasFee.error && (
        <Flex
          backgroundColor="$DEP_accentCriticalSoft"
          borderRadius="$rounded16"
          mb="$spacing12"
          p="$spacing12">
          <Text color="$statusCritical">{t('swap.warning.expectedFailure')}</Text>
        </Flex>
      )}
      {!showWarning && banner && <Flex py="$spacing16">{banner}</Flex>}
      {children ? (
        <Flex centered row gap="$spacing16" mb="$spacing16" px="$spacing12">
          <Separator />
          <TouchableArea
            alignItems="center"
            flexDirection="row"
            justifyContent="center"
            pb="$spacing4"
            pt="$spacing8"
            onPress={onPressToggleShowChildren}>
            <Text color="$neutral3" variant="body3">
              {showChildren ? t('swap.details.action.less') : t('swap.details.action.more')}
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
          <Separator />
        </Flex>
      ) : null}
      <Flex gap="$spacing8" pb="$spacing8" px="$spacing12">
        {showChildren ? <Flex gap="$spacing12">{children}</Flex> : null}
        {feeOnTransferProps && <FeeOnTransferFeeGroup {...feeOnTransferProps} />}
        {displaySwapFeeInfo && <SwapFee swapFeeInfo={swapFeeInfo} />}
        <NetworkFee chainId={chainId} gasFee={gasFee} />
        {AccountDetails}
      </Flex>
    </Flex>
  )
}
