import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { PRIVACY_SHARING_OPT_OUT_STORAGE_KEY } from 'components/PrivacyChoices/constants'
import { useAccount } from 'hooks/useAccount'
import usePrevious from 'hooks/usePrevious'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import LandingV2 from 'pages/Landing/LandingV2'
import { parse } from 'qs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ExploreContextProvider } from 'state/explore'
import { TRANSITION_DURATIONS } from 'theme/styles'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const privacySharingOptOutAtom = atomWithStorage<boolean>(PRIVACY_SHARING_OPT_OUT_STORAGE_KEY, false)

export default function Landing() {
  const account = useAccount()
  const { connector } = useWeb3React()
  const disconnect = useCallback(() => {
    connector.deactivate?.()
    connector.resetState()
  }, [connector])

  const [transition, setTransition] = useState(false)
  const location = useLocation()
  const queryParams = useMemo(() => parse(location.search, { ignoreQueryPrefix: true }), [location])
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()
  const prevAccount = usePrevious(account.address)
  const redirectOnConnect = useRef(false)

  const isInitialRender = useRef(true)

  const [privacySharingOptOut] = useAtom(privacySharingOptOutAtom)

  const { initConversionTracking } = useConversionTracking(account.address)

  useEffect(() => {
    // Track conversion leads on the landing page only
    if (!privacySharingOptOut) {
      initConversionTracking()
    }
  }, [initConversionTracking, privacySharingOptOut])

  // Smoothly redirect to swap page if user connects while on landing page
  // biome-ignore lint/correctness/useExhaustiveDependencies: account dependency is sufficient for this effect
  useEffect(() => {
    // Skip logic on the first render because prevAccount will always be undefined on the first render
    // and we don't want to redirect on the first render because that mean's we're possibly coming from
    // another page in the app.
    // We need to wait until future renders to check if the user connected while on the landing page.
    if (isInitialRender.current) {
      isInitialRender.current = false
      return undefined
    }

    if (accountDrawer.isOpen && account.address && !prevAccount) {
      redirectOnConnect.current = true
      setTransition(true)
    }
    const timeoutId = setTimeout(() => {
      if (redirectOnConnect.current) {
        navigate('/swap')
      } else if (account.address && queryParams.intro) {
        disconnect()
      }
    }, TRANSITION_DURATIONS.fast)
    return () => clearTimeout(timeoutId)
  }, [account.address, prevAccount, accountDrawer.isOpen, navigate, queryParams.intro, connector, disconnect])

  return (
    <Trace logImpression page={InterfacePageName.LandingPage}>
      <ExploreContextProvider>
        <LandingV2 transition={transition} />
      </ExploreContextProvider>
    </Trace>
  )
}
