import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { dismissedWarningTokensSelector } from 'uniswap/src/features/tokens/slice/selectors'
import { dismissTokenWarning } from 'uniswap/src/features/tokens/slice/slice'
import { BasicTokenInfo, isBasicTokenInfo } from 'uniswap/src/features/tokens/slice/types'
import { serializeToken } from 'uniswap/src/utils/currency'

export function useDismissedTokenWarnings(info: Maybe<Currency | BasicTokenInfo>): {
  tokenWarningDismissed: boolean // user dismissed warning
  onDismissTokenWarning: () => void // callback to dismiss warning
} {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedWarningTokensSelector)

  const isBasicInfo = isBasicTokenInfo(info)

  const tokenWarningDismissed = Boolean(
    (isBasicInfo || info?.isToken) && dismissedTokens && dismissedTokens[info.chainId]?.[info.address],
  )

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
