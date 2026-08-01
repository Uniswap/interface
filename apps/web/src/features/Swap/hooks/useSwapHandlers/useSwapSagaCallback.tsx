import { SharedQueryClient, TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { resolvePlatform } from 'uniswap/src/features/accounts/store/utils/flexibleInput'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { logEarnSwapUpsellConverted } from 'uniswap/src/features/earn/analytics'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { planActions } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/permitMethod'
import { type SwapCallback, type SwapCallbackParams } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useTotalBalancesUsdForAnalytics } from '~/appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { useAccountsStore, useActiveAccount } from '~/features/accounts/store/hooks'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useSetOverrideOneClickSwapFlag } from '~/pages/Swap/Swap/settings/OneClickSwap'
import { useGetOnPressRetry } from '~/state/sagas/transactions/retry'
import {
  createHandleSwapTransactionWalletCallStep,
  handleSwapTransactionStep,
  swapActions,
} from '~/state/sagas/transactions/swapSaga'
import { clearLoggedSwapSignedPlanSteps } from '~/state/sagas/transactions/swapSignedAnalytics'
import { handleUniswapXPlanSignatureStep } from '~/state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  handleApprovalTransactionStep,
  handleSignatureStep,
  sendToast,
} from '~/state/sagas/transactions/utils'

/** Resolves the active wallet account for the chain’s platform (EVM vs SVM). */
function useGetActiveAccount() {
  const evmAccount = useActiveAccount(Platform.EVM)
  const svmAccount = useActiveAccount(Platform.SVM)

  return useEvent((chainId: UniverseChainId) => {
    const platformMap = { [Platform.EVM]: evmAccount, [Platform.SVM]: svmAccount }
    const platform = resolvePlatform(chainId)
    return platformMap[platform]
  })
}

/** Web hook: wires accounts, chain selection, and analytics into the swap Redux saga. */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const selectChain = useSelectChain()
  const trace = useTrace()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const earnSwapUpsellAnalyticsProperties = useSwapFormStore((s) => s.earnSwapUpsellAnalyticsProperties)

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  const getOnPressRetry = useGetOnPressRetry()

  const getActiveAccount = useGetActiveAccount()

  const caip25Info = useAccountsStore((state) => {
    return state.getActiveConnector(Platform.EVM)?.session?.caip25Info
  })

  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)
  const rwaWhitelist = useRWAWhitelist()

  return useCallback(
    (args: SwapCallbackParams) => {
      const {
        swapTxContext,
        onSuccess,
        onFailure,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        presetPercentage,
        preselectAsset,
        isAutoSlippage,
        isFiatInputMode,
        setCurrentStep,
        setSteps,
        onPending,
        onClearForm,
      } = args
      const { trade, gasFee } = swapTxContext
      const earnIntent = trade.routing === TradingApi.Routing.CHAINED ? trade.earnIntent : undefined

      const isClassicSwap = isClassic(swapTxContext)
      const isBatched = isClassicSwap && swapTxContext.txRequests && swapTxContext.txRequests.length > 1
      const includedPermitTransactionStep = isClassicSwap && swapTxContext.permit?.method === PermitMethod.Transaction

      const priceSource = getDisplayedPriceSource({
        isCentralizedPricesEnabled,
        surface: 'usdc',
        chainId: trade.inputAmount.currency.chainId,
        address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
        queryClient: SharedQueryClient,
      })

      const analytics = getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        presetPercentage,
        preselectAsset,
        portfolioBalanceUsd,
        trace,
        isBatched,
        includedPermitTransactionStep,
        swapStartTimestamp,
        priceSource,
        rwaWhitelist,
      })

      const account = getActiveAccount(trade.inputAmount.currency.chainId)

      if (!account) {
        throw new Error('No account found')
      }

      const swapParams = {
        swapTxContext,
        caip25Info,
        address: account.address,
        analytics,
        getOnPressRetry,
        disableOneClickSwap,
        onClearForm,
        onSuccess,
        onFailure,
        setCurrentStep,
        setSteps,
        selectChain,
        startChainId: account.chainId,
        onPending,
        onTransactionHash: (hash: string): void => {
          updateSwapForm({ txHash: hash, txHashReceivedTime: Date.now() })
        },
        swapStartTimestamp,
      }
      if (swapTxContext.trade.routing === TradingApi.Routing.CHAINED) {
        const handleSwapTransactionWalletCallStep = createHandleSwapTransactionWalletCallStep({
          disableOneClickSwap,
          waitForTxHash: true,
        })

        appDispatch(
          planActions.trigger({
            ...swapParams,
            address: account.address,
            handleApprovalTransactionStep,
            handleSwapTransactionStep,
            handleSwapTransactionWalletCallStep,
            handleSignatureStep,
            handleUniswapXPlanSignatureStep,
            // oxlint-disable-next-line no-shadow
            getDisplayableError: (args) => getDisplayableError({ ...args, isPlanStep: true }),
            getOnPressRetry,
            onPlanFinalized: ({ planId }) => clearLoggedSwapSignedPlanSteps(planId),
            sendToast,
          }),
        )
      } else {
        appDispatch(swapActions.trigger(swapParams))
      }

      if (earnIntent?.action === TradingApi.EarnAction.DEPOSIT && earnSwapUpsellAnalyticsProperties) {
        logEarnSwapUpsellConverted({
          ...earnSwapUpsellAnalyticsProperties,
          toggle_state: 'on',
        })
      }

      const blockNumber = getClassicQuoteFromResponse(trade.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SwapSubmittedButtonClicked, {
        ...analytics,
        estimated_network_fee_wei: gasFee.value,
        gas_limit: isClassicSwap ? swapTxContext.txRequests?.[0]?.gasLimit?.toString() : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp ? Date.now() - swapStartTimestamp : undefined,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    },
    [
      formatter,
      portfolioBalanceUsd,
      trace,
      selectChain,
      getActiveAccount,
      appDispatch,
      swapStartTimestamp,
      getOnPressRetry,
      disableOneClickSwap,
      updateSwapForm,
      earnSwapUpsellAnalyticsProperties,
      caip25Info,
      isCentralizedPricesEnabled,
      rwaWhitelist,
    ],
  )
}
