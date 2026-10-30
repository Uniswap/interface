import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { GasFeeResult } from '@universe/api'
import { TradingApi } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { isWebApp, isWebPlatform } from '@universe/environment'
import { AnimatedFlex, Flex } from '@universe/mycelium'
import { EstimatedSwapTime } from '@universe/swap-ui'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import type { PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { NetworkFee } from 'uniswap/src/components/gas/NetworkFee'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionSettingsModal } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModal'
import { SlippageUpdate } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippageUpdate/SlippageUpdate'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { SwapFee as SwapFeeType } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
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
import { shouldShowExpectedFailureBanner } from 'uniswap/src/features/transactions/TransactionDetails/utils/shouldShowExpectedFailureBanner'

// Reanimated leg (native) of the legacy Tamagui 'fast' mount-in fade (enterStyle opacity 0 -> rest).
// On web, the enterStyle mount-flip plus the scoped opacity transition below drives the same fade;
// `entering` is ignored on web. The legacy exitStyle never played — its AnimatePresence wrapper
// unmounted together with the child — so no exit leg is carried over.
const fadeInFast: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 0 },
    animations: { opacity: withSporeCurve('fast', 1) },
  }
}

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
  /**
   * Required so no flow inherits swap-only UI by accident: gates the swap fee row, routing info,
   * the slippage modal, and the swap wording on the expected-failure banner. Bridge, chained and
   * wrap flows are not swaps here.
   */
  isSwap: boolean
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
  isSwap,
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

  // Used to show slippage settings on mobile, where the modal needs to be added outside of the conditional expected failure banner
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const showExpectedFailureBanner = shouldShowExpectedFailureBanner({
    isSwap,
    showGasFeeError,
    hasGasFeeError: Boolean(gasFee.error),
    txSimulationErrors,
  })

  return (
    <Flex>
      {showExpectedFailureBanner && (
        <ExpectedFailureBanner
          isSwap={isSwap}
          txFailureReasons={txSimulationErrors}
          mb="$spacing12"
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
            <AnimatedFlex
              entering={fadeInFast}
              gap="$spacing8"
              {...(isWebPlatform && {
                enterStyle: { opacity: 0 },
                transition: `opacity ${SPORE_ANIMATION_CURVE_CSS.fast}`,
              })}
            >
              {children}
            </AnimatedFlex>
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
