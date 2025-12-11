import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  dismissedBridgedAssetWarningsSelector,
  dismissedCompatibleAddressWarningsSelector,
  dismissedWarningTokensSelector,
} from 'uniswap/src/features/tokens/warnings/slice/selectors'
import {
  dismissBridgedAssetWarning,
  dismissCompatibleAddressWarning,
  dismissTokenWarning,
} from 'uniswap/src/features/tokens/warnings/slice/slice'
import { BasicTokenInfo, isBasicTokenInfo } from 'uniswap/src/features/tokens/warnings/slice/types'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { serializeToken } from 'uniswap/src/utils/currency'

/**
 * Result returned by dismissed-warning hooks.
 *
 * @param tokenWarningDismissed Whether the user has dismissed the warning.
 * @param onDismissTokenWarning Callback that marks the warning as dismissed.
 */
export interface DismissedWarningHookResult {
  tokenWarningDismissed: boolean
  onDismissTokenWarning: () => void
}

export function useDismissedTokenWarnings(
  info: Maybe<Currency | BasicTokenInfo>,
  warning: TokenProtectionWarning,
): DismissedWarningHookResult {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedWarningTokensSelector)

  const isBasicInfo = isBasicTokenInfo(info)

  const lowercasedAddress = isBasicInfo || info?.isToken ? getValidAddress(info) : null

  const tokenWarningDismissed = useMemo(() => {
    // if info or lowercased address is not present, we haven't dismissed the warning
    if (!info || !lowercasedAddress) {
      return false
    }

    const dismissedWarnings = dismissedTokens[info.chainId]?.[lowercasedAddress]?.warnings ?? []

    // Show as dismissed if the warning is included in the dismissed warnings
    return dismissedWarnings.includes(warning)
  }, [info, lowercasedAddress, dismissedTokens, warning])

  const onDismissTokenWarning = useCallback(() => {
    if (isBasicInfo) {
      // handle basic info
      dispatch(dismissTokenWarning({ token: info, warning }))
    } else {
      // handle tokens
      if (info?.isToken) {
        dispatch(dismissTokenWarning({ token: serializeToken(info), warning }))
      }
    }
  }, [isBasicInfo, info, dispatch, warning])

  return { tokenWarningDismissed, onDismissTokenWarning }
}

export function useDismissedBridgedAssetWarnings(info: Maybe<Currency | BasicTokenInfo>): DismissedWarningHookResult {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedBridgedAssetWarningsSelector)

  const isBasicInfo = isBasicTokenInfo(info)

  const lowercasedAddress = isBasicInfo || info?.isToken ? getValidAddress(info) : null
  const tokenWarningDismissed = Boolean(info && lowercasedAddress && dismissedTokens[info.chainId]?.[lowercasedAddress])

  const onDismissTokenWarning = useCallback(() => {
    if (isBasicInfo) {
      dispatch(dismissBridgedAssetWarning({ token: info }))
    } else {
      if (info?.isToken) {
        dispatch(dismissBridgedAssetWarning({ token: serializeToken(info) }))
      }
    }
  }, [isBasicInfo, info, dispatch])

  return { tokenWarningDismissed, onDismissTokenWarning }
}

export function useDismissedCompatibleAddressWarnings(info: Maybe<Currency>): DismissedWarningHookResult {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedCompatibleAddressWarningsSelector)

  const lowercasedAddress = info?.isToken ? getValidAddress(info) : null
  const tokenWarningDismissed = Boolean(info && lowercasedAddress && dismissedTokens[info.chainId]?.[lowercasedAddress])

  const onDismissTokenWarning = useCallback(() => {
    if (info?.isToken) {
      dispatch(dismissCompatibleAddressWarning({ token: serializeToken(info) }))
    }
  }, [info, dispatch])

  return { tokenWarningDismissed, onDismissTokenWarning }
}
