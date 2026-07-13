import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { GasFeeResult } from '@universe/api'
import { TradingApi } from '@universe/api'
import { isWebApp } from '@universe/environment'
import type { PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex } from 'ui/src'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import { EstimatedSwapTime } from 'uniswap/src/features/transactions/swap/components/EstimatedBridgeTime'
import { SlippageUpdate } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippageUpdate/SlippageUpdate'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isChained, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { ExpectedFailureBanner } from 'uniswap/src/features/transactions/TransactionDetails/ExpectedFailureBanner'
import { FeeOnTransferFeeGroup } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { ListSeparatorToggle } from 'uniswap/src/features/transactions/TransactionDetails/ListSeparatorToggle'
import { SwapFee } from 'uniswap/src/features/transactions/TransactionDetails/SwapFee'
import { SwapReviewTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/SwapReviewTokenWarningCard'
import { TransactionWarning } from 'uniswap/src/features/transactions/TransactionDetails/TransactionWarning'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'

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
  routingType?: TradingApi.Routing
  estimatedSwapTime?: number | undefined
  AccountDetails?: JSX.Element
  RoutingInfo?: JSX.Element
  CollapsedInfoRow?: JSX.Element
  RateInfo?: JSX.Element
  /**
   * Optional override for the default `NetworkFee` row. When provided, this
   * replaces the inline `<NetworkFee />` render (used by the gas overrides
   * feature to swap in the interactive Network cost row + modals).
   */
  NetworkCostRowSlot?: ReactNode
  transactionUSDValue?: Maybe<CurrencyAmount<Currency>>
  txSimulationErrors?: TradingApi.TransactionFailureReason[]
  includesDelegation?: boolean
  sponsorshipInfo?: TradingApi.SponsorshipInfo
}

// oxlint-disable-next-line complexity
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
  transactionUSDValue,
  txSimulationErrors,
  routingType,
  isSwap: isSwapProp,
  AccountDetails,
  estimatedSwapTime,
  RoutingInfo,
  CollapsedInfoRow,
  RateInfo,
  NetworkCostRowSlot,
  includesDelegation,
  sponsorshipInfo,
}: PropsWithChildren<TransactionDetailsProps>): JSX.Element {
  const { t } = useTranslation()
  const [showChildren, setShowChildren] = useState(showExpandedChildren)

  const onPressToggleShowChildren = (): void => {
    if (!showChildren) {
      sendAnalyticsEvent(SwapEventName.SwapDetailsExpanded)
    }
    setShowChildren(!showChildren)
  }

  const isChainedTrade = routingType && isChained({ routing: routingType })
  const isBridgeTrade = routingType && isBridge({ routing: routingType })
  const isWrapTrade = routingType && isWrap({ routing: routingType })
  const isSwap = isSwapProp ?? (!isBridgeTrade && !isChainedTrade && !isWrapTrade)

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
          {showChildren ? RateInfo : null}
          {feeOnTransferProps && <FeeOnTransferFeeGroup {...feeOnTransferProps} />}
          <EstimatedSwapTime showIfLongerThanCutoff={true} timeMs={estimatedSwapTime} />
          {isSwap && outputCurrency && (
            <SwapFee currency={outputCurrency} loading={indicative} swapFee={swapFee} swapFeeUsd={swapFeeUsd} />
          )}
          {NetworkCostRowSlot ?? (
            <NetworkFee
              chainId={chainId}
              gasFee={gasFee}
              indicative={indicative}
              transactionUSDValue={transactionUSDValue}
              uniswapXGasBreakdown={uniswapXGasBreakdown}
              includesDelegation={includesDelegation}
              showNetworkLogo={showNetworkLogo}
              sponsorshipInfo={sponsorshipInfo}
            />
          )}
          {!showChildren && CollapsedInfoRow}
          {(isSwap || isChainedTrade) && RoutingInfo}
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
        <Flex mt="$spacing16">
          <TransactionWarning warning={warning} onShowWarning={onShowWarning} />
        </Flex>
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
