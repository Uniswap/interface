import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { getRecentConnectionMeta } from 'connection/meta'
import { useExitAnimation } from 'featureFlags/flags/landingPageV2'
import usePrevious from 'hooks/usePrevious'
import { parse } from 'qs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch } from 'state/hooks'
import { setRecentConnectionDisconnected } from 'state/user/reducer'
import { TRANSITION_DURATIONS } from 'theme/styles'
import LandingV2 from './LandingV2'

export default function Landing() {
  const { account, connector } = useWeb3React()
  const recentConnectionMeta = getRecentConnectionMeta()
  const dispatch = useAppDispatch()
  const disconnect = useCallback(() => {
    connector.deactivate?.()
    connector.resetState()
    dispatch(setRecentConnectionDisconnected())
  }, [connector, dispatch])

  const isExitAnimationEnabled = useExitAnimation()
  const [transition, setTransition] = useState(false)
  const location = useLocation()
  const queryParams = useMemo(() => parse(location.search, { ignoreQueryPrefix: true }), [location])
  const navigate = useNavigate()
  const [accountDrawerOpen] = useAccountDrawer()
  const prevAccount = usePrevious(account)
  const redirectOnConnect = useRef(false)
  // Smoothly redirect to swap page if user connects while on landing page
  useEffect(() => {
    if (accountDrawerOpen && account && !prevAccount) {
      redirectOnConnect.current = true
      setTransition(true)
    }
    const timeoutId = setTimeout(
      () => {
        if (redirectOnConnect.current) {
          navigate('/swap')
        } else if (account && queryParams.intro) {
          disconnect()
        }
      },
      isExitAnimationEnabled ? TRANSITION_DURATIONS.slow : TRANSITION_DURATIONS.fast
    )
    return () => clearTimeout(timeoutId)
  }, [
    account,
    prevAccount,
    accountDrawerOpen,
    navigate,
    queryParams.intro,
    connector,
    disconnect,
    isExitAnimationEnabled,
  ])

  // Redirect to swap page if user is connected or has been recently
  // The intro query parameter can be used to override this
  if ((account || recentConnectionMeta) && !queryParams.intro) {
    return <Navigate to={{ ...location, pathname: '/swap' }} replace />
  }

  return (
    <Trace page={InterfacePageName.LANDING_PAGE} shouldLogImpression>
      <LandingV2 transition={isExitAnimationEnabled && transition} />
    </Trace>
  )
}
