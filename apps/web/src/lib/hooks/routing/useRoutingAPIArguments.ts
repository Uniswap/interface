import { SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useIsUniswapXSupportedChain } from 'hooks/useIsUniswapXSupportedChain'
import {
  createGetRoutingAPIArguments,
  type RoutingAPIInput,
  validateRoutingAPIInput,
} from 'lib/hooks/routing/createGetRoutingAPIArguments'
import { useMemo } from 'react'
import { GetQuoteArgs } from 'state/routing/types'
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
