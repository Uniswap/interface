import { TradingApi } from '@universe/api'
import { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { type ChainedActionEarnIntent, type Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

/**
 * Semantic identity used only for active/prefetched Earn plan reuse.
 * If these fields differ, we create a fresh plan instead of resuming stale calldata.
 */
export interface EarnPlanReuseIdentity {
  action: TradingApi.EarnAction
  vault: string
  chainId: number
  withdrawMode?: TradingApi.EarnWithdrawMode
  inputToken?: string
  inputTokenChainId?: number
  terminalToken?: string
  terminalTokenChainId?: number
}

export function getEarnPlanReuseIdentityFromTrade(trade: Trade): EarnPlanReuseIdentity | undefined {
  if (!isChained(trade)) {
    return undefined
  }

  const quote = trade.quote.quote
  const quoteInput = quote.input as Partial<TradingApi.QuoteInput> | undefined
  const quoteOutput = quote.output as Partial<TradingApi.QuoteOutput> | undefined
  return getEarnPlanReuseIdentity({
    earnIntent: trade.earnIntent,
    inputToken: quoteInput?.token,
    inputTokenChainId: toFiniteNumber(quote.tokenInChainId),
    terminalToken: quoteOutput?.token,
    terminalTokenChainId: toFiniteNumber(quote.tokenOutChainId),
  })
}

export function getEarnPlanReuseIdentityFromValidatedInput(
  validatedInput: ValidatedTradeInput,
  earnIntent?: ChainedActionEarnIntent,
): EarnPlanReuseIdentity | undefined {
  return getEarnPlanReuseIdentity({
    earnIntent,
    inputToken: validatedInput.tokenInAddress,
    inputTokenChainId: validatedInput.tokenInChainId,
    terminalToken: validatedInput.tokenOutAddress,
    terminalTokenChainId: validatedInput.tokenOutChainId,
  })
}

export function getEarnPlanReuseIdentityFromPlanResponse(
  planResponse: TradingApi.PlanResponse,
): EarnPlanReuseIdentity | undefined {
  const firstStep = planResponse.steps[0]
  const lastStep = planResponse.steps[planResponse.steps.length - 1]

  return getEarnPlanReuseIdentity({
    earnIntent: planResponse.earnIntent,
    inputToken: firstStep?.tokenIn,
    inputTokenChainId: toFiniteNumber(firstStep?.tokenInChainId),
    terminalToken: lastStep?.tokenOut,
    terminalTokenChainId: toFiniteNumber(lastStep?.tokenOutChainId),
  })
}

export function areEarnPlanReuseIdentitiesCompatible({
  activeIdentity,
  currentIdentity,
}: {
  activeIdentity: EarnPlanReuseIdentity | undefined
  currentIdentity: EarnPlanReuseIdentity | undefined
}): boolean {
  if (!activeIdentity && !currentIdentity) {
    return true
  }

  if (!activeIdentity || !currentIdentity) {
    return false
  }

  return (
    activeIdentity.action === currentIdentity.action &&
    activeIdentity.chainId === currentIdentity.chainId &&
    activeIdentity.withdrawMode === currentIdentity.withdrawMode &&
    areAddressesEqual({
      addressInput1: { address: activeIdentity.vault, chainId: activeIdentity.chainId },
      addressInput2: { address: currentIdentity.vault, chainId: currentIdentity.chainId },
    }) &&
    inputTokensMatch(activeIdentity, currentIdentity) &&
    terminalTokensMatch(activeIdentity, currentIdentity)
  )
}

function getEarnPlanReuseIdentity({
  earnIntent,
  inputToken,
  inputTokenChainId,
  terminalToken,
  terminalTokenChainId,
}: {
  earnIntent?: ChainedActionEarnIntent
  inputToken?: string
  inputTokenChainId?: number
  terminalToken?: string
  terminalTokenChainId?: number
}): EarnPlanReuseIdentity | undefined {
  if (!earnIntent) {
    return undefined
  }

  return {
    action: earnIntent.action,
    vault: earnIntent.vault,
    chainId: Number(earnIntent.chainId),
    withdrawMode: earnIntent.withdrawMode,
    inputToken,
    inputTokenChainId,
    terminalToken,
    terminalTokenChainId,
  }
}

function inputTokensMatch(identityA: EarnPlanReuseIdentity, identityB: EarnPlanReuseIdentity): boolean {
  // Token fields are a secondary guard. Older/resumed plan responses may omit them,
  // so missing token data skips this check while action/vault/chain/mode still match strictly.
  if (!identityA.inputToken || !identityB.inputToken || !identityA.inputTokenChainId || !identityB.inputTokenChainId) {
    return true
  }

  return (
    identityA.inputTokenChainId === identityB.inputTokenChainId &&
    areAddressesEqual({
      addressInput1: { address: identityA.inputToken, chainId: identityA.inputTokenChainId },
      addressInput2: { address: identityB.inputToken, chainId: identityB.inputTokenChainId },
    })
  )
}

function terminalTokensMatch(identityA: EarnPlanReuseIdentity, identityB: EarnPlanReuseIdentity): boolean {
  // Token fields are a secondary guard. Older/resumed plan responses may omit them,
  // so missing token data skips this check while action/vault/chain/mode still match strictly.
  if (
    !identityA.terminalToken ||
    !identityB.terminalToken ||
    !identityA.terminalTokenChainId ||
    !identityB.terminalTokenChainId
  ) {
    return true
  }

  return (
    identityA.terminalTokenChainId === identityB.terminalTokenChainId &&
    areAddressesEqual({
      addressInput1: { address: identityA.terminalToken, chainId: identityA.terminalTokenChainId },
      addressInput2: { address: identityB.terminalToken, chainId: identityB.terminalTokenChainId },
    })
  )
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
