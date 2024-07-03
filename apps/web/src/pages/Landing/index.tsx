import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import LandingV2 from 'pages/Landing/LandingV2'
import { parse } from 'qs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { TRANSITION_DURATIONS } from 'theme/styles'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'

export default function Landing() {
  const account = useAccount()
  const { connector } = useWeb3React()
  const hasRecentConnection = !!useRecentConnectorId()
  const disconnect = useCallback(() => {
    connector?.deactivate?.()
    connector?.resetState()
  }, [connector])

  const isExitAnimationEnabled = useFeatureFlag(FeatureFlags.ExitAnimation)
  const [transition, setTransition] = useState(false)
  const location = useLocation()
  const queryParams = useMemo(() => parse(location.search, { ignoreQueryPrefix: true }), [location])
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()
  const prevAccount = usePrevious(account.address)
  const redirectOnConnect = useRef(false)
  // Smoothly redirect to swap page if user connects while on landing page
  useEffect(() => {
    if (accountDrawer.isOpen && account.address && !prevAccount) {
      redirectOnConnect.current = true
      setTransition(true)
    }
    const timeoutId = setTimeout(
      () => {
        if (redirectOnConnect.current) {
          navigate('/swap')
        } else if (account.address && queryParams.intro) {
          disconnect()
        }
      },
      isExitAnimationEnabled ? TRANSITION_DURATIONS.slow : TRANSITION_DURATIONS.fast,
    )
    return () => clearTimeout(timeoutId)
  }, [
    account.address,
    prevAccount,
    accountDrawer,
    navigate,
    queryParams.intro,
    connector,
    disconnect,
    isExitAnimationEnabled,
  ])

  // Redirect to swap page if user is connected or has been recently
  // The intro query parameter can be used to override this

  if ((account.isConnected || hasRecentConnection) && !queryParams.intro) {
    return <Navigate to={{ ...location, pathname: '/swap' }} replace />
  }

  return (
    <Trace logImpression page={InterfacePageName.LANDING_PAGE}>
      <LandingV2 transition={isExitAnimationEnabled && transition} />
    </Trace>
  )
}
