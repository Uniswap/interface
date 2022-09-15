import { ApolloProvider } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Popover, Sidetab } from '@typeform/embed-react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { Route, Switch } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import TopBanner from 'components/Header/TopBanner'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Popups from 'components/Popups'
import Web3ReactManager from 'components/Web3ReactManager'
import { GOOGLE_RECAPTCHA_KEY } from 'constants/env'
import { BLACKLIST_WALLETS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { useIsDarkMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { isAddressString, shortenAddress } from 'utils'

import { RedirectDuplicateTokenIds } from './AddLiquidityV2/redirects'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import ProAmmSwap from './SwapProAmm'
import SwapV2 from './SwapV2'

// Route-based code splitting
const Pools = lazy(() => import(/* webpackChunkName: 'pools-page' */ './Pools'))
const Pool = lazy(() => import(/* webpackChunkName: 'my-pool-page' */ './Pool'))

const Yield = lazy(() => import(/* webpackChunkName: 'yield-page' */ './Yield'))
const PoolFinder = lazy(() => import(/* webpackChunkName: 'pool-finder-page' */ './PoolFinder'))
const CreatePool = lazy(() => import(/* webpackChunkName: 'create-pool-page' */ './CreatePool'))
const ProAmmRemoveLiquidity = lazy(
  () => import(/* webpackChunkName: 'elastic-remove-liquidity-page' */ './RemoveLiquidityProAmm'),
)
const RedirectCreatePoolDuplicateTokenIds = lazy(
  () =>
    import(
      /* webpackChunkName: 'redirect-create-pool-duplicate-token-ids-page' */ './CreatePool/RedirectDuplicateTokenIds'
    ),
)
const RedirectOldCreatePoolPathStructure = lazy(
  () =>
    import(
      /* webpackChunkName: 'redirect-old-create-pool-path-structure-page' */ './CreatePool/RedirectOldCreatePoolPathStructure'
    ),
)

const AddLiquidity = lazy(() => import(/* webpackChunkName: 'add-liquidity-page' */ './AddLiquidity'))
const IncreaseLiquidity = lazy(() => import(/* webpackChunkName: 'add-liquidity-page' */ './IncreaseLiquidity'))

const RemoveLiquidity = lazy(() => import(/* webpackChunkName: 'remove-liquidity-page' */ './RemoveLiquidity'))

const AboutKyberSwap = lazy(() => import(/* webpackChunkName: 'about-page' */ './About/AboutKyberSwap'))
const AboutKNC = lazy(() => import(/* webpackChunkName: 'about-knc' */ './About/AboutKNC'))

const CreateReferral = lazy(() => import(/* webpackChunkName: 'create-referral-page' */ './CreateReferral'))

const TrueSight = lazy(() => import(/* webpackChunkName: 'true-sight-page' */ './TrueSight'))

const BuyCrypto = lazy(() => import(/* webpackChunkName: 'true-sight-page' */ './BuyCrypto'))

const Campaign = lazy(() => import(/* webpackChunkName: 'campaigns-page' */ './Campaign'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  z-index: 3;
`

const BodyWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  align-items: center;
  min-height: calc(100vh - 148px);
  flex: 1;

  ${isMobile && `overflow-x: hidden;`}
`
export const AppPaths = { SWAP_LEGACY: '/swap-legacy', ABOUT: '/about', SWAP: '/swap', CAMPAIGN: '/campaigns' }

export default function App() {
  const { account, chainId } = useActiveWeb3React()

  useEffect(() => {
    if (account) {
      Sentry.setUser({
        id: account,
      })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setContext('network', {
        chainId: chainId,
        name: NETWORKS_INFO[chainId].name,
      })
    }
  }, [chainId])

  const classicClient = NETWORKS_INFO[chainId || ChainId.MAINNET].classicClient

  const theme = useTheme()
  const isDarkTheme = useIsDarkMode()

  const { width } = useWindowSize()
  useGlobalMixpanelEvents()
  const { pathname } = window.location
  const showFooter = !pathname.includes(AppPaths.ABOUT)

  return (
    <ErrorBoundary>
      {width && width >= 768 ? (
        <Sidetab
          id={isDarkTheme ? 'W5TeOyyH' : 'K0dtSO0v'}
          buttonText="Feedback"
          buttonColor={theme.primary}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      ) : (
        <Popover
          id={isDarkTheme ? 'W5TeOyyH' : 'K0dtSO0v'}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      )}
      {(BLACKLIST_WALLETS.includes(isAddressString(account)) ||
        BLACKLIST_WALLETS.includes(account?.toLowerCase() || '')) && (
        <Modal
          isOpen
          onDismiss={function (): void {
            //
          }}
          maxWidth="600px"
          width="80vw"
        >
          <Flex flexDirection="column" padding="24px" width="100%">
            <Flex alignItems="center">
              <AlertTriangle color={theme.red} />
              <Text fontWeight="500" fontSize={24} color={theme.red} marginLeft="8px">
                <Trans>Warning</Trans>
              </Text>
            </Flex>
            <Text marginTop="24px" fontSize="14px" lineHeight={2}>
              The US Treasury&apos;s OFAC has published a list of addresses associated with Tornado Cash. Your wallet
              address below is flagged as one of the addresses on this list, provided by our compliance vendor. As a
              result, it is blocked from using KyberSwap and all of its related services at this juncture.
            </Text>
            <Flex
              marginTop="24px"
              padding="12px"
              backgroundColor={theme.buttonBlack}
              sx={{ borderRadius: '12px' }}
              flexDirection="column"
            >
              <Text>Your wallet address</Text>
              <Text color={theme.subText} fontSize={20} marginTop="12px" fontWeight="500">
                {isMobile ? shortenAddress(account || '', 10) : account}
              </Text>
            </Flex>
          </Flex>
        </Modal>
      )}

      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <GoogleReCaptchaProvider reCaptchaKey={GOOGLE_RECAPTCHA_KEY}>
          <ApolloProvider client={classicClient}>
            <Route component={DarkModeQueryParamReader} />
            <AppWrapper>
              <TopBanner />
              <HeaderWrapper>
                <Header />
              </HeaderWrapper>
              <Suspense fallback={<Loader />}>
                <BodyWrapper>
                  <Popups />
                  <Web3ReactManager>
                    <Switch>
                      <Route exact strict path={AppPaths.SWAP_LEGACY} component={Swap} />

                      <Route exact strict path="/swap/:network/:fromCurrency-to-:toCurrency" component={SwapV2} />
                      <Route exact strict path="/swap/:network/:fromCurrency" component={SwapV2} />

                      <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                      <Route exact strict path="/swap" component={SwapV2} />

                      <Route exact strict path="/find" component={PoolFinder} />
                      <Route exact strict path="/pools" component={Pools} />
                      <Route exact strict path="/pools/:currencyIdA" component={Pools} />
                      <Route exact strict path="/pools/:currencyIdA/:currencyIdB" component={Pools} />
                      <Route exact strict path="/farms" component={Yield} />
                      <Route exact strict path="/myPools" component={Pool} />

                      {/* Create new pool */}
                      <Route exact path="/create" component={CreatePool} />
                      <Route exact path="/create/:currencyIdA" component={RedirectOldCreatePoolPathStructure} />
                      <Route
                        exact
                        path="/create/:currencyIdA/:currencyIdB"
                        component={RedirectCreatePoolDuplicateTokenIds}
                      />

                      {/* Add liquidity */}
                      <Route exact path="/add/:currencyIdA/:currencyIdB/:pairAddress" component={AddLiquidity} />

                      <Route
                        exact
                        strict
                        path="/remove/:currencyIdA/:currencyIdB/:pairAddress"
                        component={RemoveLiquidity}
                      />

                      <Route exact strict path="/elastic/swap" component={ProAmmSwap} />
                      <Route exact strict path="/elastic/remove/:tokenId" component={ProAmmRemoveLiquidity} />
                      <Route
                        exact
                        strict
                        path="/elastic/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                        component={RedirectDuplicateTokenIds}
                      />

                      <Route
                        exact
                        strict
                        path="/elastic/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                        component={IncreaseLiquidity}
                      />

                      <Route exact path="/about/kyberswap" component={AboutKyberSwap} />
                      <Route exact path="/about/knc" component={AboutKNC} />
                      <Route exact path="/referral" component={CreateReferral} />
                      <Route exact path="/discover" component={TrueSight} />
                      <Route exact path="/buy-crypto" component={BuyCrypto} />
                      <Route exact path={`${AppPaths.CAMPAIGN}/:slug?`} component={Campaign} />

                      <Route component={RedirectPathToSwapOnly} />
                    </Switch>
                  </Web3ReactManager>
                </BodyWrapper>
                {showFooter && <Footer />}
              </Suspense>
            </AppWrapper>
          </ApolloProvider>
        </GoogleReCaptchaProvider>
      )}
    </ErrorBoundary>
  )
}
