import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnglesMaximize } from 'ui/src/components/icons/AnglesMaximize'
import { AnglesMinimize } from 'ui/src/components/icons/AnglesMinimize'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  FeeOnTransferFeeGroup,
  FeeOnTransferFeeGroupProps,
} from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { SwapFee } from 'uniswap/src/features/transactions/TransactionDetails/SwapFee'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/hooks/useSwapTxAndGasInfo'
import { SwapFeeInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { WalletChainId } from 'uniswap/src/types/chains'

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: WalletChainId
  gasFee: GasFeeResult
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  showExpandedChildren?: boolean
  swapFeeInfo?: SwapFeeInfo
  showWarning?: boolean
  warning?: Warning
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  onShowWarning?: () => void
  indicative?: boolean
  isSwap?: boolean
  AccountDetails?: JSX.Element
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
}

export function TransactionDetails({
  banner,
  children,
  showExpandedChildren,
  chainId,
  gasFee,
  uniswapXGasBreakdown,
  swapFeeInfo,
  showWarning,
  warning,
  feeOnTransferProps,
  onShowWarning,
  indicative = false,
  isSwap,
  transactionUSDValue,
  AccountDetails,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const { t } = useTranslation()
  const warningColor = getAlertColor(warning?.severity)

  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

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
            py="$spacing8"
          >
            <AlertTriangleFilled color={warningColor?.text} size="$icon.16" />
            <Flex fill py="$spacing2">
              <Text color={warningColor.text} variant="body3">
                {warning.title}
              </Text>
            </Flex>
          </Flex>
        </TouchableArea>
      )}
      {gasFee.error && (
        <Flex backgroundColor="$DEP_accentCriticalSoft" borderRadius="$rounded16" mb="$spacing12" p="$spacing12">
          <Text color="$statusCritical">{t('swap.warning.expectedFailure')}</Text>
        </Flex>
      )}
      {!showWarning && banner && <Flex py="$spacing16">{banner}</Flex>}
      {children ? (
        <ListSeparatorToggle
          closedText={t('common.button.showMore')}
          isOpen={showChildren}
          openText={t('common.button.showLess')}
          onPress={onPressToggleShowChildren}
        />
      ) : null}
      <Flex gap="$spacing8" pb="$spacing8" px="$spacing12">
        {showChildren ? <Flex gap="$spacing12">{children}</Flex> : null}
        {feeOnTransferProps && <FeeOnTransferFeeGroup {...feeOnTransferProps} />}
        {isSwap && <SwapFee loading={indicative} swapFeeInfo={swapFeeInfo} />}
        <NetworkFee
          chainId={chainId}
          gasFee={gasFee}
          indicative={indicative}
          transactionUSDValue={transactionUSDValue}
          uniswapXGasBreakdown={uniswapXGasBreakdown}
        />
        {AccountDetails}
      </Flex>
    </Flex>
  )
}

export const ListSeparatorToggle = ({
  onPress,
  isOpen,
  openText,
  closedText,
}: {
  onPress: (() => void) | null | undefined
  isOpen?: boolean
  openText: string
  closedText: string
}): JSX.Element => {
  return (
    <Flex centered row gap="$spacing16" mb="$spacing16" px="$spacing12">
      <Separator />
      <TouchableArea
        alignItems="center"
        flexDirection="row"
        justifyContent="center"
        pb="$spacing4"
        pt="$spacing8"
        onPress={onPress}
      >
        <Text color="$neutral3" variant="body3">
          {isOpen ? openText : closedText}
        </Text>
        {isOpen ? (
          <AnglesMinimize color="$neutral3" size="$icon.20" />
        ) : (
          <AnglesMaximize color="$neutral3" size="$icon.20" />
        )}
      </TouchableArea>
      <Separator />
    </Flex>
  )
}
