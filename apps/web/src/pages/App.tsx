import { useFeatureFlagUrlOverrides } from 'featureFlags/useFeatureFlagUrlOverrides'
import ErrorBoundary from 'components/ErrorBoundary'
import { HashKeyChainOnlyModal } from 'components/HashKeyChainOnlyModal'
import { useAccount } from 'hooks/useAccount'
import { Body } from 'pages/App/Body'
import { AppLayout } from 'pages/App/Layout'
import { ResetPageScrollEffect } from 'pages/App/utils/ResetPageScroll'
import { UserPropertyUpdater } from 'pages/App/utils/UserPropertyUpdater'
import { useDynamicMetatags } from 'pages/metatags'
import { findRouteByPath } from 'pages/RouteDefinitions'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { Navigate, useLocation } from 'react-router'
import DarkModeQueryParamReader from 'theme/components/DarkModeQueryParamReader'
import { useSporeColors } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EXTENSION_PASSKEY_AUTH_PATH } from 'uniswap/src/features/passkey/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isPathBlocked } from 'utils/blockedPaths'
import { MICROSITE_LINK } from 'utils/openDownloadApp'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

const OVERRIDE_PAGE_LAYOUT = [EXTENSION_PASSKEY_AUTH_PATH]

// 支持的链 ID：仅 HashKey Chain 主网和测试网
const ALLOWED_CHAIN_IDS = [UniverseChainId.HashKey, UniverseChainId.HashKeyTestnet]

export default function App() {
  const colors = useSporeColors()
  const account = useAccount()
  const [showHashKeyModal, setShowHashKeyModal] = useState(false)

  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)

  useFeatureFlagUrlOverrides()

  // 检查当前链是否在允许的链列表中
  useEffect(() => {
    if (account.chainId !== undefined) {
      const isAllowedChain = ALLOWED_CHAIN_IDS.includes(account.chainId)
      setShowHashKeyModal(!isAllowedChain)
    } else {
      // 如果链 ID 未定义（钱包未连接），不显示弹窗
      setShowHashKeyModal(false)
    }
  }, [account.chainId])


  const metaTags = useDynamicMetatags()
  const staticTitle = findRouteByPath(pathname)?.getTitle(pathname) ?? 'Uniswap Interface'
  const staticDescription = findRouteByPath(pathname)?.getDescription(pathname)

  // redirect address to landing pages until implemented
  const shouldRedirectToAppInstall = pathname.startsWith('/address/')
  useLayoutEffect(() => {
    if (shouldRedirectToAppInstall) {
      window.location.href = MICROSITE_LINK
    }
  }, [shouldRedirectToAppInstall])

  if (shouldRedirectToAppInstall) {
    return null
  }

  const shouldBlockPath = isPathBlocked(pathname)
  if (shouldBlockPath && pathname !== '/swap') {
    return <Navigate to="/swap" replace />
  }

  const shouldOverridePageLayout = OVERRIDE_PAGE_LAYOUT.includes(pathname)

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <Trace page={currentPage}>
        {/*
          This is where *static* page titles are injected into the <head> tag. If you
          want to set a page title based on data that's dynamic or not available on first render,
          you can set it later in the page component itself, since react-helmet-async prefers the most recently rendered title.
        */}
        <Helmet>
          <title>{staticTitle}</title>
          {staticDescription && <meta name="description" content={staticDescription} />}
          {staticDescription && <meta property="og:description" content={staticDescription} />}
          {metaTags.map((tag, index) => (
            <meta key={index} {...tag} />
          ))}
          <style>{`
            html {
              ::-webkit-scrollbar-thumb {
                background-color: ${colors.surface3.val};
              }
              scrollbar-color: ${colors.surface3.val} ${colors.surface1.val};
            }
          `}</style>
        </Helmet>
        <UserPropertyUpdater />
        <ResetPageScrollEffect />
        {shouldOverridePageLayout ? <Body shouldRenderAppChrome={false} /> : <AppLayout />}
        <HashKeyChainOnlyModal
          isOpen={showHashKeyModal}
          onClose={() => setShowHashKeyModal(false)}
          currentChainId={account.chainId}
        />
      </Trace>
    </ErrorBoundary>
  )
}
