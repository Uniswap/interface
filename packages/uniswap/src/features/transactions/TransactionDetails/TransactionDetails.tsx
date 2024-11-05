import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, Separator, Text, TouchableArea } from 'ui/src'
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
import { FeeOnTransferWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferWarningCard'
import { SwapFee } from 'uniswap/src/features/transactions/TransactionDetails/SwapFee'
import { EstimatedTime } from 'uniswap/src/features/transactions/swap/review/EstimatedTime'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { openUri } from 'uniswap/src/utils/linking'

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: UniverseChainId
  gasFee: GasFeeResult
  swapFee?: SwapFeeType
  swapFeeUsd?: number
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  showExpandedChildren?: boolean
  showGasFeeError?: boolean
  showWarning?: boolean
  showSeparatorToggle?: boolean
  warning?: Warning
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  feeOnTransferWarningChecked?: boolean
  setFeeOnTransferWarningChecked?: (checked: boolean) => void
  outputCurrency?: Currency
  onShowWarning?: () => void
  indicative?: boolean
  isSwap?: boolean
  isBridgeTrade?: boolean
  estimatedBridgingTime?: number
  AccountDetails?: JSX.Element
  RoutingInfo?: JSX.Element
  RateInfo?: JSX.Element
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
}

export function TransactionDetails({
  banner,
  children,
  showExpandedChildren,
  chainId,
  gasFee,
  outputCurrency,
  uniswapXGasBreakdown,
  swapFee,
  swapFeeUsd,
  showGasFeeError = true,
  showSeparatorToggle = true,
  showWarning,
  warning,
  feeOnTransferProps,
  feeOnTransferWarningChecked,
  setFeeOnTransferWarningChecked,
  onShowWarning,
  indicative = false,
  isSwap,
  transactionUSDValue,
  isBridgeTrade,
  AccountDetails,
  estimatedBridgingTime,
  RoutingInfo,
  RateInfo,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const { t } = useTranslation()
  const showFeeOnTransferWarningCard =
    !!feeOnTransferProps && !feeOnTransferWarningChecked && !!setFeeOnTransferWarningChecked

  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

  return (
    <Flex>
      {showGasFeeError && gasFee.error && <GasFeeError warning={warning} />}
      {!showWarning && banner && <Flex py="$spacing16">{banner}</Flex>}
      {children && showSeparatorToggle ? (
        <ListSeparatorToggle
          closedText={t('common.button.showMore')}
          isOpen={showChildren}
          openText={t('common.button.showLess')}
          onPress={onPressToggleShowChildren}
        />
      ) : null}
      <Flex gap="$spacing16" pb="$spacing8">
        <Flex gap="$spacing8" px="$spacing8">
          {RateInfo}
          {feeOnTransferProps && <FeeOnTransferFeeGroup {...feeOnTransferProps} />}
          {isSwap && isBridgeTrade && <EstimatedTime visibleIfLong={true} timeMs={estimatedBridgingTime} />}
          {isSwap && outputCurrency && (
            <SwapFee currency={outputCurrency} loading={indicative} swapFee={swapFee} swapFeeUsd={swapFeeUsd} />
          )}
          <NetworkFee
            chainId={chainId}
            gasFee={gasFee}
            indicative={indicative}
            transactionUSDValue={transactionUSDValue}
            uniswapXGasBreakdown={uniswapXGasBreakdown}
          />
          {isSwap && RoutingInfo}
          {AccountDetails}
          {showChildren ? (
            <AnimatePresence>
              <Flex animation="fast" exitStyle={{ opacity: 0 }} enterStyle={{ opacity: 0 }} gap="$spacing8">
                {children}
              </Flex>
            </AnimatePresence>
          ) : null}
        </Flex>
        {showFeeOnTransferWarningCard && (
          <FeeOnTransferWarningCard
            checked={!!feeOnTransferWarningChecked}
            setChecked={setFeeOnTransferWarningChecked}
            {...feeOnTransferProps}
          />
        )}
      </Flex>
      {showWarning && warning && onShowWarning && (
        <TransactionWarning warning={warning} onShowWarning={onShowWarning} />
      )}
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

const TransactionWarning = ({
  warning,
  onShowWarning,
}: {
  warning: Warning
  onShowWarning: () => void
}): JSX.Element => {
  const { t } = useTranslation()
  const warningColor = getAlertColor(warning?.severity)

  return (
    <TouchableArea mt="$spacing6" onPress={onShowWarning}>
      <Flex
        row
        alignItems="flex-start"
        p="$spacing12"
        borderRadius="$rounded16"
        backgroundColor="$surface2"
        gap="$spacing12"
      >
        <Flex centered p="$spacing8" borderRadius="$rounded12" backgroundColor={warningColor.background}>
          <AlertTriangleFilled color={warningColor.text} size="$icon.16" />
        </Flex>
        <Flex gap="$spacing4" flex={1}>
          <Text color={warningColor.text} variant="body3">
            {warning.title}
          </Text>
          <Text color="$neutral2" variant="body3">
            {warning.message}
          </Text>
          <TouchableArea
            onPress={async (e) => {
              const link = warning.link
              if (link) {
                e.stopPropagation()
                await openUri(link)
              }
            }}
          >
            <Text color="$neutral1" variant="body3">
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

const GasFeeError = ({ warning }: { warning?: Warning }): JSX.Element => {
  const { t } = useTranslation()
  const warningColor = getAlertColor(warning?.severity)

  return (
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
      <Text color="$statusCritical" variant="body3">
        {t('swap.warning.expectedFailure')}
      </Text>
    </Flex>
  )
}
