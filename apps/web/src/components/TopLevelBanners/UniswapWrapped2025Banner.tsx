import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useLocation, useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { WRAPPED_PATH } from 'uniswap/src/components/banners/shared/utils'
import { UniswapWrapped2025Banner } from 'uniswap/src/components/banners/UniswapWrapped2025Banner/UniswapWrapped2025Banner'
import { selectHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'

export function useRenderUniswapWrapped2025Banner(): JSX.Element | null {
  const isFeatureFlagEnabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)
  const hasDismissed = useAppSelector((state: InterfaceState) => selectHasDismissedUniswapWrapped2025Banner(state))
  const { pathname } = useLocation()
  const isWrappedPage = pathname.startsWith(WRAPPED_PATH)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleDismiss = (): void => {
    dispatch(setHasDismissedUniswapWrapped2025Banner(true))
  }

  const handlePress = (): void => {
    dispatch(setHasDismissedUniswapWrapped2025Banner(true))
    navigate(WRAPPED_PATH)
  }

  if (isFeatureFlagEnabled && !hasDismissed && !isWrappedPage) {
    return <UniswapWrapped2025Banner handleDismiss={handleDismiss} handlePress={handlePress} />
  }

  return null
}
