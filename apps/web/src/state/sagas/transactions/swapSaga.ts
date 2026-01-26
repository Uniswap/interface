import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { TradingApi } from '@universe/api'
import { Experiments } from '@universe/gating'
import { Interface } from '@ethersproject/abi'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS, ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useSetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { handleAtomicSendCalls } from 'state/sagas/transactions/5792'
import { useGetOnPressRetry } from 'state/sagas/transactions/retry'
import { jupiterSwap } from 'state/sagas/transactions/solana'
import { handleUniswapXPlanSignatureStep, handleUniswapXSignatureStep } from 'state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import { VitalTxFields } from 'state/transactions/types'
import { call, SagaGenerator } from 'typed-redux-saga'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { logExperimentQualifyingEvent } from 'uniswap/src/features/telemetry/utils/logExperimentQualifyingEvent'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import {
  HandleOnChainStepParams,
  HandleSwapStepParams,
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { UNCONNECTED_ADDRESS } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import {
  ExtractedBaseTradeAnalyticsProperties,
  getBaseTradeAnalyticsProperties,
} from 'uniswap/src/features/transactions/swap/analytics'
import { getFlashblocksExperimentStatus } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { planSaga } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { handleSwitchChains } from 'uniswap/src/features/transactions/swap/plan/utils'
import { getSwapTxRequest, SwapTransactionStepBatched } from 'uniswap/src/features/transactions/swap/steps/swap'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  SwapCallback,
  SwapCallbackParams,
  SwapExecutionCallbacks,
} from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { PermitMethod, ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ChainedActionTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import {
  isClassic,
  isJupiter,
  requireRouting,
  UNISWAPX_ROUTING_VARIANTS,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import {
  isSignerMnemonicAccountDetails,
  SignerMnemonicAccountDetails,
} from 'uniswap/src/features/wallet/types/AccountDetails'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

function patchFirstWordAddressIfUnconnected(input: string, recipientAddress: string): string {
  if (typeof input !== 'string' || !input.startsWith('0x') || input.length < 66) {
    return input
  }

  const firstWord = input.slice(2, 66) // 32 bytes
  const embeddedAddress = `0x${firstWord.slice(24)}`.toLowerCase()
  if (embeddedAddress !== UNCONNECTED_ADDRESS.toLowerCase()) {
    return input
  }

  const addrNo0x = recipientAddress.toLowerCase().replace(/^0x/, '')
  const padded = addrNo0x.padStart(64, '0')
  return `0x${padded}${input.slice(66)}`
}

/**
 * Extracts total amountIn from all exactInput calls in multicall data
 * This is used to ensure sufficient token allowance for Universal Router
 */
function getTotalAmountInFromMulticall(multicallData: string): bigint | undefined {
  try {
    const MULTICALL_ABI = ['function multicall(bytes[] data) payable returns (bytes[] results)']
    const EXACT_INPUT_ABI = [
      'function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum))',
    ]

    const multicallIface = new Interface(MULTICALL_ABI)
    const exactInputIface = new Interface(EXACT_INPUT_ABI)

    const decoded = multicallIface.decodeFunctionData('multicall', multicallData)
    const calls = decoded[0]

    let totalAmountIn = BigInt(0)
    for (const callData of calls) {
      try {
        const decodedCall = exactInputIface.decodeFunctionData('exactInput', callData)
        const params = decodedCall[0]
        // amountIn is a BigNumber from ethers, convert to bigint
        totalAmountIn += BigInt(params.amountIn.toString())
      } catch {
        // Skip if not exactInput call
      }
    }

    return totalAmountIn > 0 ? totalAmountIn : undefined
  } catch {
    return undefined
  }
}

/**
 * Patches recipient address in multicall exactInput calls
 * Replaces the recipient address in each exactInput call within multicall
 * 
 * Why use multicall directly?
 * 1. Universal Router supports multicall natively (as seen in successful transactions)
 * 2. Multicall format is simpler and already proven to work
 * 3. No need for complex conversion to execute format
 */
function patchMulticallRecipient(multicallData: string, recipientAddress: string): string {
  try {
    const MULTICALL_ABI = ['function multicall(bytes[] data) payable returns (bytes[] results)']
    const EXACT_INPUT_ABI = [
      'function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum))',
    ]

    const multicallIface = new Interface(MULTICALL_ABI)
    const exactInputIface = new Interface(EXACT_INPUT_ABI)

    const decoded = multicallIface.decodeFunctionData('multicall', multicallData)
    const calls = decoded[0]

    // Patch each call's recipient address
    const patchedCalls = calls.map((callData: string) => {
      try {
        const decodedCall = exactInputIface.decodeFunctionData('exactInput', callData)
        const params = decodedCall[0]

        // Check if recipient needs to be patched
        // Only patch if recipient is UNCONNECTED_ADDRESS (placeholder from Trading API)
        // 
        // Note: Other recipient addresses (like 0xfCb42db392E6641fFA057f143aCe1953759f708f)
        // should be preserved as they may be special addresses that Universal Router handles correctly.
        // The key issue was insufficient token allowance, not the recipient address itself.
        const currentRecipient = params.recipient.toLowerCase()
        const unconnectedAddress = UNCONNECTED_ADDRESS.toLowerCase()

        // Only patch if recipient is UNCONNECTED_ADDRESS
        if (currentRecipient === unconnectedAddress) {
          // Re-encode exactInput with user address as recipient
          const patchedParams = {
            ...params,
            recipient: recipientAddress,
          }
          return exactInputIface.encodeFunctionData('exactInput', [patchedParams])
        }

        return callData
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Swap] Failed to patch multicall call:', error)
        }
        return callData
      }
    })

    // Re-encode multicall with patched calls
    return multicallIface.encodeFunctionData('multicall', [patchedCalls])
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Swap] Failed to patch multicall recipient:', error)
    }
    return multicallData
  }
}

function normalizeHexData(data: string): string {
  return data.startsWith('0x') ? data : `0x${data}`
}

/**
 * Converts multicall (SwapRouter02) calldata to Universal Router execute format.
 * This handles the case where Trading API returns multicall instead of execute.
 * 
 * Note: This is a simplified conversion. For production, consider using Universal Router SDK
 * to properly rebuild the swap commands from the trade object instead of converting calldata.
 */
function convertMulticallToExecute(
  multicallData: string,
  deadlineSeconds: number,
  recipientAddress: string,
): string | undefined {
  try {
    const MULTICALL_ABI = ['function multicall(bytes[] data) payable returns (bytes[] results)']
    const EXACT_INPUT_ABI = [
      'function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum))',
    ]
    const EXECUTE_3_ABI = ['function execute(bytes commands, bytes[] inputs, uint256 deadline)']

    const multicallIface = new Interface(MULTICALL_ABI)
    const exactInputIface = new Interface(EXACT_INPUT_ABI)
    const executeIface = new Interface(EXECUTE_3_ABI)

    const decoded = multicallIface.decodeFunctionData('multicall', multicallData)
    const calls = decoded[0]

    // For now, log that we detected multicall but don't convert
    // The proper solution is to ensure Trading API returns execute format,
    // or rebuild using Universal Router SDK from the trade object
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Swap] Received multicall calldata - conversion to execute not yet implemented. ' +
          'Consider using Universal Router SDK to rebuild from trade object.',
      )
    }

    // Return undefined to fall back to original data
    // TODO: Implement proper conversion using Universal Router SDK
    return undefined
  } catch {
    return undefined
  }
}

function fixUniversalRouterExecuteData({
  data,
  deadlineSeconds,
  recipientAddress,
}: {
  data: string | undefined
  deadlineSeconds: number | undefined
  recipientAddress: string | undefined
}): string | undefined {
  if (!data || typeof data !== 'string') {
    return data
  }
  if (!deadlineSeconds || !Number.isFinite(deadlineSeconds)) {
    return data
  }
  if (!recipientAddress) {
    return data
  }

  try {
    const normalized = normalizeHexData(data)
    const selector = normalized.slice(0, 10).toLowerCase()

    // Check if it's multicall (SwapRouter02)
    // Universal Router supports multicall directly, so we can use it as-is
    // Just need to patch recipient address if needed
    // 
    // Why use multicall instead of converting to execute?
    // 1. Universal Router natively supports multicall (proven by successful transactions)
    // 2. Multicall format is simpler and already working
    // 3. Conversion to execute format has been problematic
    const MULTICALL_SELECTOR = '0xac9650d8'
    if (selector === MULTICALL_SELECTOR.toLowerCase()) {
      // Patch recipient address in multicall instead of converting to execute
      // This is simpler and matches the successful transaction format
      //
      // IMPORTANT: When using multicall, ensure sufficient token allowance for Universal Router.
      // Multicall may contain multiple swap calls, each with its own amountIn.
      // The total amount needed = sum of all amountIn values in all exactInput calls.
      // Universal Router requires direct ERC20 approval (not just Permit2 approval).
      const totalAmountIn = getTotalAmountInFromMulticall(normalized)
      if (totalAmountIn && process.env.NODE_ENV === 'development') {
        console.log(
          `[Swap] Multicall total amountIn: ${totalAmountIn.toString()} (${totalAmountIn.toString() / BigInt(10 ** 18)} tokens)`,
        )
      }
      const patched = patchMulticallRecipient(normalized, recipientAddress)
      if (patched !== normalized) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Swap] Patched recipient address in multicall calldata')
        }
        logger.info(
          'swapSaga',
          'fixUniversalRouterExecuteData',
          '[Swap] Patched multicall recipient',
          {
            originalRecipient: 'from multicall',
            newRecipient: recipientAddress,
            selector: MULTICALL_SELECTOR,
            approach: 'multicall_direct',
          },
        )
        return patched
      }
      // If no patching needed, return original multicall data
      if (process.env.NODE_ENV === 'development') {
        console.log('[Swap] Using multicall calldata directly (Universal Router supports it)')
      }
      logger.info(
        'swapSaga',
        'fixUniversalRouterExecuteData',
        '[Swap] Using multicall calldata directly',
        {
          selector: MULTICALL_SELECTOR,
          approach: 'multicall_direct',
          recipient: recipientAddress,
          totalAmountIn: totalAmountIn?.toString(),
          note: 'Ensure token allowance >= totalAmountIn for Universal Router',
        },
      )
      return normalized
    }

    // Handle execute format (2-param or 3-param)
    const EXECUTE_2_ABI = ['function execute(bytes commands, bytes[] inputs)']
    const EXECUTE_3_ABI = ['function execute(bytes commands, bytes[] inputs, uint256 deadline)']
    const iface2 = new Interface(EXECUTE_2_ABI)
    const iface3 = new Interface(EXECUTE_3_ABI)

    const execute2Selector = iface2.getSighash('execute').toLowerCase()
    const execute3Selector = iface3.getSighash('execute').toLowerCase()

    let commands: string
    let inputs: string[]

    if (selector === execute2Selector) {
      const decoded = iface2.decodeFunctionData('execute', normalized)
      commands = decoded[0]
      inputs = decoded[1]
    } else if (selector === execute3Selector) {
      const decoded = iface3.decodeFunctionData('execute', normalized)
      commands = decoded[0]
      inputs = decoded[1]
    } else {
      return data
    }

    const patchedInputs = inputs.map((input) => patchFirstWordAddressIfUnconnected(input, recipientAddress))
    return iface3.encodeFunctionData('execute', [commands, patchedInputs, deadlineSeconds])
  } catch {
    return data
  }
}

function* handleSwapTransactionStep(params: HandleSwapStepParams): SagaGenerator<string> {
  const { trade, step, signature, analytics, onTransactionHash } = params

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] handleSwapTransactionStep: Starting', {
      stepType: step.type,
      hasStep: !!step,
      hasSignature: !!signature,
    })
  }

  const info = getSwapTransactionInfo({
    trade,
    isFinalStep: analytics.is_final_step,
    swapStartTimestamp: analytics.swap_start_timestamp,
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] handleSwapTransactionStep: Calling getSwapTxRequest')
  }
  const txRequest = yield* call(getSwapTxRequest, step, signature)
  const deadlineSeconds = typeof (trade as any).deadline === 'number' ? (trade as any).deadline : undefined
  const recipientAddress = (params as HandleSwapStepParams & { address?: string }).address
  const txRequestDataFixed = fixUniversalRouterExecuteData({
    data: txRequest.data?.toString(),
    deadlineSeconds,
    recipientAddress,
  })
  const txRequestFixed =
    txRequestDataFixed && txRequestDataFixed !== txRequest.data?.toString()
      ? { ...txRequest, data: txRequestDataFixed }
      : txRequest

  const originalSelector = txRequest.data?.toString()?.slice(0, 10)?.toLowerCase()
  const finalSelector = txRequestFixed.data?.toString()?.slice(0, 10)?.toLowerCase()
  const wasModified = txRequestDataFixed && txRequestDataFixed !== txRequest.data?.toString()

  ;(globalThis as any).__SWAP_SAGA_LAST_TX__ = {
    stage: 'afterGetSwapTxRequest',
    time: Date.now(),
    chainId: txRequestFixed.chainId,
    to: txRequestFixed.to,
    originalSelector,
    finalSelector,
    wasModified,
    deadlineSeconds,
    recipientAddress,
    originalDataLength: txRequest.data?.toString()?.length,
    finalDataLength: txRequestFixed.data?.toString()?.length,
  }

  logger.info('swapSaga', 'handleSwapTransactionStep', 'Prepared swap txRequest', {
    chainId: txRequestFixed.chainId,
    to: txRequestFixed.to,
    originalSelector,
    finalSelector,
    wasModified,
    deadlineSeconds,
    recipientAddress,
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] Calldata transformation:', {
      originalSelector,
      finalSelector,
      wasModified,
      deadlineSeconds,
      recipientAddress,
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] handleSwapTransactionStep: Got txRequest:', {
      hasTxRequest: !!txRequestFixed,
      to: txRequestFixed?.to,
      chainId: txRequestFixed?.chainId,
    })
  }

  const onModification = ({ hash, data }: VitalTxFields) => {
    sendAnalyticsEvent(SwapEventName.SwapModifiedInWallet, {
      ...analytics,
      txHash: hash,
      expected: txRequestFixed.data?.toString() ?? '',
      actual: data,
    })
  }

  // Now that we have the txRequest, we can create a definitive SwapTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest: txRequestFixed }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] handleSwapTransactionStep: About to call handleOnChainStep:', {
      stepType: onChainStep.type,
      hasTxRequest: !!onChainStep.txRequest,
    })
  }
  
  const hash = yield* call(handleOnChainStep, {
    ...params,
    info,
    step: onChainStep,
    ignoreInterrupt: true, // We avoid interruption during the swap step, since it is too late to give user a new trade once the swap is submitted.
    shouldWaitForConfirmation: false,
    onModification,
    allowDuplicativeTx: true, // Allow duplicate transactions for swap - user may want to submit multiple swaps
  })

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] handleSwapTransactionStep: handleOnChainStep returned hash:', hash)
  }

  handleSwapTransactionAnalytics({ ...params, hash })

  const chainId = trade.inputAmount.currency.chainId
  const { shouldLogQualifyingEvent, shouldShowModal } = getFlashblocksExperimentStatus({
    chainId,
    routing: trade.routing,
  })

  if (shouldLogQualifyingEvent) {
    logExperimentQualifyingEvent({
      experiment: Experiments.UnichainFlashblocksModal,
    })
  }

  // Show regular popup for control variant or ineligible swaps
  if (!shouldShowModal) {
    popupRegistry.addPopup(
      { type: PopupType.Transaction, hash },
      hash,
      isL2ChainId(chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS,
    )
  }

  // Update swap form store with actual transaction hash
  if (onTransactionHash) {
    onTransactionHash(hash)
  }

  return hash
}

interface HandleSwapBatchedStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStepBatched
  trade: ClassicTrade | BridgeTrade
  analytics: SwapTradeBaseProperties
  disableOneClickSwap: () => void
}
function* handleSwapTransactionBatchedStep(params: HandleSwapBatchedStepParams) {
  const { trade, step, disableOneClickSwap, analytics } = params

  const info = getSwapTransactionInfo({
    trade,
    swapStartTimestamp: analytics.swap_start_timestamp,
  })

  const batchId = yield* handleAtomicSendCalls({
    ...params,
    info,
    step,
    ignoreInterrupt: true, // We avoid interruption during the swap step, since it is too late to give user a new trade once the swap is submitted.
    shouldWaitForConfirmation: false,
    disableOneClickSwap,
  })
  handleSwapTransactionAnalytics({ ...params, batchId })

  popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)

  return
}

function handleSwapTransactionAnalytics(params: {
  trade: ClassicTrade | BridgeTrade | ChainedActionTrade
  analytics: SwapTradeBaseProperties
  hash?: string
  batchId?: string
}) {
  const { trade, analytics, hash, batchId } = params

  sendAnalyticsEvent(
    SwapEventName.SwapSigned,
    formatSwapSignedAnalyticsEventProperties({
      trade,
      allowedSlippage: trade.slippageTolerance ? slippageToleranceToPercent(trade.slippageTolerance) : ZERO_PERCENT,
      fiatValues: {
        amountIn: analytics.token_in_amount_usd,
        amountOut: analytics.token_out_amount_usd,
        feeUsd: analytics.fee_usd,
      },
      txHash: hash,
      portfolioBalanceUsd: analytics.total_balances_usd,
      trace: analytics,
      isBatched: Boolean(batchId),
      includedPermitTransactionStep: analytics.included_permit_transaction_step,
      batchId,
      planId: analytics.plan_id,
      stepIndex: analytics.step_index,
    }),
  )
}

type SwapParams = SwapExecutionCallbacks & {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountDetails
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSwapTxContext
  getOnPressRetry: (error: Error | undefined) => (() => void) | undefined
  // TODO(WEB-7763): Upgrade jotai to v2 to avoid need for prop drilling `disableOneClickSwap`
  disableOneClickSwap: () => void
  onTransactionHash?: (hash: string) => void
  v4Enabled: boolean
  swapStartTimestamp?: number
}

function* swap(params: SwapParams) {
  const {
    account,
    disableOneClickSwap,
    setCurrentStep,
    swapTxContext,
    analytics,
    onSuccess,
    onFailure,
    v4Enabled,
    setSteps,
  } = params
  const { trade } = swapTxContext

  const swapChainId = swapTxContext.trade.inputAmount.currency.chainId
  
  const { chainSwitchFailed } = yield* call(handleSwitchChains, {
    selectChain: params.selectChain,
    startChainId: params.startChainId,
    swapTxContext,
  })
  
  if (chainSwitchFailed) {
    const error = new Error(`Chain switch failed: unable to switch from chain ${params.startChainId} to chain ${swapChainId}`)
    if (process.env.NODE_ENV === 'development') {
      console.error('[Swap] Error: Chain switch failed', {
        error: error.message,
        startChainId: params.startChainId,
        swapChainId,
      })
    }
    const onPressRetry = params.getOnPressRetry(error)
    onFailure(error, onPressRetry)
    return
  }

  const steps = yield* call(generateSwapTransactionSteps, swapTxContext, v4Enabled)
  setSteps(steps)

  let signature: string | undefined
  let step: TransactionStep | undefined

  try {
    // TODO(SWAP-287): Integrate jupiter swap into TransactionStep, rather than special-casing.
    if (isJupiter(swapTxContext)) {
      yield* call(jupiterSwap, { ...params, swapTxContext })
      yield* call(onSuccess)
      return
    }

    for (step of steps) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Swap] swap saga: Processing step:', {
          stepType: step.type,
          stepIndex: steps.indexOf(step),
        })
      }
      switch (step.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Swap] swap saga: Handling approval step')
          }
          yield* call(handleApprovalTransactionStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Swap] swap saga: Handling permit signature step')
          }
          signature = yield* call(handleSignatureStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Transaction: {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Swap] swap saga: Handling permit transaction step')
          }
          yield* call(handlePermitTransactionStep, { address: account.address, step, setCurrentStep })
          break
        }
        case TransactionStepType.SwapTransaction:
        case TransactionStepType.SwapTransactionAsync: {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Swap] swap saga: Handling swap transaction step:', {
              stepType: step.type,
              hasTxRequest: 'txRequest' in step && !!step.txRequest,
            })
          }
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionStep, {
            address: account.address,
            signature,
            step,
            setCurrentStep,
            trade,
            analytics,
            onTransactionHash: params.onTransactionHash,
          })
          break
        }
        case TransactionStepType.SwapTransactionBatched: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionBatchedStep, {
            address: account.address,
            step,
            setCurrentStep,
            trade,
            analytics,
            disableOneClickSwap,
          })
          break
        }
        case TransactionStepType.UniswapXSignature: {
          requireRouting(trade, UNISWAPX_ROUTING_VARIANTS)
          yield* call(handleUniswapXSignatureStep, { address: account.address, step, setCurrentStep, trade, analytics })
          break
        }
        default: {
          throw new UnexpectedTransactionStateError(`Unexpected step type: ${step.type}`)
        }
      }
    }
  } catch (error) {
    const displayableError = getDisplayableError({ error, step })
    if (displayableError) {
      logger.error(displayableError, { tags: { file: 'swapSaga', function: 'swap' } })
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[Swap] swap saga: Error occurred:', {
        error: displayableError?.message || error instanceof Error ? error.message : String(error),
        stepType: step?.type,
      })
    }
    const onPressRetry = params.getOnPressRetry(displayableError)
    onFailure(displayableError, onPressRetry)
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Swap] swap saga: All steps completed, calling onSuccess')
  }
  yield* call(onSuccess)
}

export const swapSaga = createSaga(swap, 'swapSaga')

/** Callback to submit trades and track progress */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const v4SwapEnabled = useV4SwapEnabled(startChainId)
  const trace = useTrace()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  const getOnPressRetry = useGetOnPressRetry()
  const wallet = useWallet()

  return useCallback(
    (args: SwapCallbackParams) => {
      if (process.env.NODE_ENV === 'development') {
        const hasTxRequests = 'txRequests' in args.swapTxContext && Array.isArray(args.swapTxContext.txRequests)
        const txRequestCount =
          'txRequests' in args.swapTxContext && Array.isArray(args.swapTxContext.txRequests)
            ? args.swapTxContext.txRequests.length
            : 0
        console.log('[Swap] swapCallback called', {
          routing: args.swapTxContext.routing,
          hasTxRequests,
          txRequestCount,
        })
      }
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
      } = args
      const { trade, gasFee } = swapTxContext

      const isClassicSwap = isClassic(swapTxContext)
      const isBatched = isClassicSwap && swapTxContext.txRequests && swapTxContext.txRequests.length > 1
      const includedPermitTransactionStep = isClassicSwap && swapTxContext.permit?.method === PermitMethod.Transaction

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
      })

      const account = isSVMChain(trade.inputAmount.currency.chainId) ? wallet.svmAccount : wallet.evmAccount

      if (!account || !isSignerMnemonicAccountDetails(account)) {
        throw new Error('No account found')
      }

      const swapParams = {
        swapTxContext,
        account,
        analytics,
        getOnPressRetry,
        disableOneClickSwap,
        onSuccess,
        onFailure,
        setCurrentStep,
        setSteps,
        selectChain,
        startChainId,
        v4Enabled: v4SwapEnabled,
        onPending,
        onTransactionHash: (hash: string): void => {
          updateSwapForm({ txHash: hash, txHashReceivedTime: Date.now() })
        },
        swapStartTimestamp,
      }
      if (swapTxContext.trade.routing === TradingApi.Routing.CHAINED) {
        appDispatch(
          planSaga.actions.trigger({
            ...swapParams,
            address: account.address,
            handleApprovalTransactionStep,
            handleSwapTransactionStep,
            handleSignatureStep,
            getDisplayableError,
            handleUniswapXPlanSignatureStep,
          }),
        )
      } else {
        appDispatch(swapSaga.actions.trigger(swapParams))
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
      startChainId,
      v4SwapEnabled,
      appDispatch,
      swapStartTimestamp,
      getOnPressRetry,
      disableOneClickSwap,
      wallet.evmAccount,
      wallet.svmAccount,
      updateSwapForm,
    ],
  )
}
