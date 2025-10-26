import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex } from 'ui/src'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import { EstimatedBridgeTime } from 'uniswap/src/features/transactions/swap/components/EstimatedBridgeTime'
import { SlippageUpdate } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippageUpdate/SlippageUpdate'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { ExpectedFailureBanner } from 'uniswap/src/features/transactions/TransactionDetails/ExpectedFailureBanner'
import { ExpectedSpeed } from 'uniswap/src/features/transactions/TransactionDetails/ExpectedSpeed'
import { FeeOnTransferFeeGroup } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { ListSeparatorToggle } from 'uniswap/src/features/transactions/TransactionDetails/ListSeparatorToggle'
import { SwapFee } from 'uniswap/src/features/transactions/TransactionDetails/SwapFee'
import { SwapReviewTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/SwapReviewTokenWarningCard'
import { TransactionWarning } from 'uniswap/src/features/transactions/TransactionDetails/TransactionWarning'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { UserReceiveAmount } from 'uniswap/src/features/transactions/TransactionDetails/UserReceiveAmount'
import { isWebApp } from 'utilities/src/platform'

interface TransactionDetailsProps {
  banner?: ReactNode
  chainId: UniverseChainId
  gasFee: GasFeeResult
  swapFee?: SwapFeeType
  swapFeeUsd?: number
  uniswapXGasBreakdown?: UniswapXGasBreakdown
  showExpandedChildren?: boolean
  showGasFeeError?: boolean
  showNetworkLogo?: boolean
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
  txSimulationErrors?: TradingApi.TransactionFailureReason[]
  amountUserWillReceive?: CurrencyAmount<Currency>
  includesDelegation?: boolean
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
  showNetworkLogo = true,
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
  amountUserWillReceive,
  includesDelegation,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const { t } = useTranslation()
  const [showChildren, setShowChildren] = useState(showExpandedChildren)
  const priceUXEnabled = usePriceUXEnabled()

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendAnalyticsEvent(SwapEventName.SwapDetailsExpanded)
    }
    setShowChildren(!showChildren)
  }

  // Used to show slippage settings on mobile, where the modal needs to be added outside of the conditional expected failure banner
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const showExpectedFailureBanner =
    isSwap &&
    ((showGasFeeError && gasFee.error) ||
      txSimulationErrors?.includes(TradingApi.TransactionFailureReason.SIMULATION_ERROR) ||
      txSimulationErrors?.includes(TradingApi.TransactionFailureReason.SLIPPAGE_TOO_LOW))

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
      <Flex gap="$spacing16">
        <Flex gap="$spacing8" px="$spacing8">
          {showChildren && priceUXEnabled ? (
            <AnimatePresence>
              <Flex animation="fast" exitStyle={{ opacity: 0 }} enterStyle={{ opacity: 0 }} gap="$spacing8">
                {children}
              </Flex>
            </AnimatePresence>
          ) : null}
          {RateInfo}
          {feeOnTransferProps && <FeeOnTransferFeeGroup {...feeOnTransferProps} />}
          {isSwap && isBridgeTrade && <EstimatedBridgeTime visibleIfLong={true} timeMs={estimatedBridgingTime} />}
          {isSwap && outputCurrency && (
            <SwapFee currency={outputCurrency} loading={indicative} swapFee={swapFee} swapFeeUsd={swapFeeUsd} />
          )}
          <NetworkFee
            chainId={chainId}
            gasFee={gasFee}
            indicative={indicative}
            transactionUSDValue={transactionUSDValue}
            uniswapXGasBreakdown={uniswapXGasBreakdown}
            includesDelegation={includesDelegation}
            showNetworkLogo={showNetworkLogo}
          />
          {isSwap && RoutingInfo}
          {AccountDetails}
          <ExpectedSpeed chainId={chainId} />
          {showChildren && !priceUXEnabled ? (
            <AnimatePresence>
              <Flex animation="fast" exitStyle={{ opacity: 0 }} enterStyle={{ opacity: 0 }} gap="$spacing8">
                {children}
              </Flex>
            </AnimatePresence>
          ) : null}
          {amountUserWillReceive && outputCurrency && priceUXEnabled && (
            <UserReceiveAmount amountUserWillReceive={amountUserWillReceive} outputCurrency={outputCurrency} />
          )}
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
      {!isWebApp && isSwap && (
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
