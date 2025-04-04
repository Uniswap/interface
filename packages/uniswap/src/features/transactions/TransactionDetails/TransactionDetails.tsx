import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, Popover, Separator, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnglesMaximize } from 'ui/src/components/icons/AnglesMaximize'
import { AnglesMinimize } from 'ui/src/components/icons/AnglesMinimize'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FeeOnTransferFeeGroup } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { SwapFee } from 'uniswap/src/features/transactions/TransactionDetails/SwapFee'
import { SwapReviewTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/SwapReviewTokenWarningCard'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { EstimatedTime } from 'uniswap/src/features/transactions/swap/review/EstimatedTime'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/swap/settings/TransactionSettingsModal'
import { SlippageUpdate } from 'uniswap/src/features/transactions/swap/settings/configs/SlippageUpdate'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { isInterface } from 'utilities/src/platform'

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
  tokenWarningProps?: TokenWarningProps
  tokenWarningChecked?: boolean
  setTokenWarningChecked?: (checked: boolean) => void
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
  txSimulationErrors?: TransactionFailureReason[]
}

// eslint-disable-next-line complexity
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
  tokenWarningProps,
  tokenWarningChecked,
  setTokenWarningChecked,
  onShowWarning,
  indicative = false,
  isSwap,
  transactionUSDValue,
  txSimulationErrors,
  isBridgeTrade,
  AccountDetails,
  estimatedBridgingTime,
  RoutingInfo,
  RateInfo,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const { t } = useTranslation()
  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED)
    }
    setShowChildren(!showChildren)
  }

  // Used to show slippage settings on mobile, where the modal needs to be added outside of the conditional expected failure banner
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const showExpectedFailureBanner =
    isSwap &&
    ((showGasFeeError && gasFee.error) ||
      txSimulationErrors?.includes(TransactionFailureReason.SIMULATION_ERROR) ||
      txSimulationErrors?.includes(TransactionFailureReason.SLIPPAGE_TOO_LOW))

  return (
    <Flex>
      {showExpectedFailureBanner && (
        <ExpectedFailureBanner
          txFailureReasons={txSimulationErrors}
          onSlippageEditPress={() => setShowSlippageSettings(true)}
        />
      )}
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
        {setTokenWarningChecked && tokenWarningProps && (
          <SwapReviewTokenWarningCard
            checked={!!tokenWarningChecked}
            setChecked={setTokenWarningChecked}
            feeOnTransferProps={feeOnTransferProps}
            tokenWarningProps={tokenWarningProps}
          />
        )}
      </Flex>
      {showWarning && warning && onShowWarning && (
        <TransactionWarning warning={warning} onShowWarning={onShowWarning} />
      )}
      {!isInterface && isSwap && (
        <TransactionSettingsModal
          settings={[SlippageUpdate]}
          initialSelectedSetting={SlippageUpdate}
          isOpen={showSlippageSettings}
          onClose={() => setShowSlippageSettings(false)}
        />
      )}
    </Flex>
  )
}

export function ListSeparatorToggle({
  onPress,
  isOpen,
  openText,
  closedText,
}: {
  onPress: (() => void) | null | undefined
  isOpen?: boolean
  openText: string
  closedText: string
}): JSX.Element {
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
  const { title, severity, message, link } = warning

  return (
    <TouchableArea onPress={onShowWarning}>
      <InlineWarningCard hideCtaIcon severity={severity} heading={title} description={message} learnMoreUrl={link} />
    </TouchableArea>
  )
}

function ExpectedFailureBanner({
  txFailureReasons,
  onSlippageEditPress,
}: {
  txFailureReasons?: TransactionFailureReason[]
  onSlippageEditPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const showSlippageWarning = txFailureReasons?.includes(TransactionFailureReason.SLIPPAGE_TOO_LOW)

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      borderRadius="$rounded16"
      borderColor="$surface3"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing12"
    >
      <Flex row justifyContent="flex-start" gap="$spacing12" alignItems="center">
        <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
        <Flex gap="$spacing4">
          <Text color="$statusWarning" variant="buttonLabel3">
            {t('swap.warning.expectedFailure.titleMay')}
          </Text>
          {showSlippageWarning && (
            <Text color="$neutral2" variant="body4">
              {t('swap.warning.expectedFailure.increaseSlippage')}
            </Text>
          )}
        </Flex>
      </Flex>
      {showSlippageWarning && <SlippageEdit onWalletSlippageEditPress={onSlippageEditPress} />}
    </Flex>
  )
}

function SlippageEdit({
  onWalletSlippageEditPress: onSlippageEditPress,
}: {
  onWalletSlippageEditPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [showInterfaceSlippageSettings, setShowInterfaceSlippageSettings] = useState(false)
  const editButton = (
    <Button
      size="xxsmall"
      emphasis="secondary"
      fill={false}
      onPress={() => (isInterface ? setShowInterfaceSlippageSettings(true) : onSlippageEditPress?.())}
    >
      {t('common.button.edit')}
    </Button>
  )

  if (!isInterface) {
    return editButton
  }

  // Web needs to use a popover, so we need to wrap both the button and the modal in a popover
  return (
    <Popover
      placement="bottom-end"
      open={showInterfaceSlippageSettings}
      onOpenChange={(open) => {
        if (!open && isInterface) {
          setShowInterfaceSlippageSettings(false)
        }
      }}
    >
      <Popover.Trigger asChild>{editButton}</Popover.Trigger>
      <TransactionSettingsModal
        settings={[SlippageUpdate]}
        initialSelectedSetting={SlippageUpdate}
        isOpen={showInterfaceSlippageSettings}
        onClose={() => setShowInterfaceSlippageSettings(false)}
      />
    </Popover>
  )
}
