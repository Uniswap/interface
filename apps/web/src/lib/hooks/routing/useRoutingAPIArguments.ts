import { SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { useIsUniswapXSupportedChain } from 'hooks/useIsUniswapXSupportedChain'
import {
  createGetRoutingAPIArguments,
  validateRoutingAPIInput,
  type RoutingAPIInput,
} from 'lib/hooks/routing/createGetRoutingAPIArguments'
import { useMemo } from 'react'
import { GetQuoteArgs } from 'state/routing/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useIsMismatchAccountQuery } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { useUniswapXPriorityOrderFlag } from 'uniswap/src/features/transactions/swap/utils/protocols'

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped. Input arguments do not need to be memoized, as they will
 * be destructured.
 */
export function useRoutingAPIArguments(input: RoutingAPIInput): GetQuoteArgs | SkipToken {
  const isUniswapXSupportedChain = useIsUniswapXSupportedChain(input.tokenIn?.chainId)
  const isPriorityOrdersEnabled = useUniswapXPriorityOrderFlag(input.tokenIn?.chainId)
  const isDutchV3Enabled = useFeatureFlag(FeatureFlags.ArbitrumDutchV3)
  const { data: isDelegationMismatch } = useIsMismatchAccountQuery({ chainId: input.tokenIn?.chainId })
  // if there is a mismatched account, we want to disable uniswapX
  const canUseUniswapX = isUniswapXSupportedChain && !isDelegationMismatch

  const getRoutingAPIArguments = useMemo(
    () =>
      createGetRoutingAPIArguments({
        canUseUniswapX,
        isPriorityOrdersEnabled,
        isDutchV3Enabled,
      }),
    [canUseUniswapX, isPriorityOrdersEnabled, isDutchV3Enabled],
  )

  const { tokenIn, tokenOut, amount, account, routerPreference, protocolPreferences, tradeType } = input

  const inputValidated = validateRoutingAPIInput(input)

  return useMemo(() => {
    if (!inputValidated) {
      return skipToken
    }
    return getRoutingAPIArguments({
      account,
      tokenIn,
      tokenOut,
      amount,
      tradeType,
      routerPreference,
      protocolPreferences,
    })
  }, [
    getRoutingAPIArguments,
    tokenIn,
    tokenOut,
    amount,
    account,
    routerPreference,
    protocolPreferences,
    tradeType,
    inputValidated,
  ])
}
