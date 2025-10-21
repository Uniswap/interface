import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  dismissedBridgedAssetWarningsSelector,
  dismissedWarningTokensSelector,
} from 'uniswap/src/features/tokens/slice/selectors'
import { dismissBridgedAssetWarning, dismissTokenWarning } from 'uniswap/src/features/tokens/slice/slice'
import { BasicTokenInfo, isBasicTokenInfo } from 'uniswap/src/features/tokens/slice/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { serializeToken } from 'uniswap/src/utils/currency'

export function useDismissedTokenWarnings(info: Maybe<Currency | BasicTokenInfo>): {
  tokenWarningDismissed: boolean // user dismissed warning
  onDismissTokenWarning: () => void // callback to dismiss warning
} {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedWarningTokensSelector)

  const isBasicInfo = isBasicTokenInfo(info)

  const lowercasedAddress = isBasicInfo || info?.isToken ? getValidAddress(info) : null
  const tokenWarningDismissed = Boolean(info && lowercasedAddress && dismissedTokens[info.chainId]?.[lowercasedAddress])

  const onDismissTokenWarning = useCallback(() => {
    if (isBasicInfo) {
      // handle basic info
      dispatch(dismissTokenWarning({ token: info }))
    } else {
      // handle tokens
      if (info?.isToken) {
        dispatch(dismissTokenWarning({ token: serializeToken(info) }))
      }
    }
  }, [isBasicInfo, info, dispatch])

  return { tokenWarningDismissed, onDismissTokenWarning }
}

export function useDismissedBridgedAssetWarnings(info: Maybe<Currency | BasicTokenInfo>): {
  tokenWarningDismissed: boolean // user dismissed warning
  onDismissTokenWarning: () => void // callback to dismiss warning
} {
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
