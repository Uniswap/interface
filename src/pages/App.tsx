import { datadogRum } from '@datadog/browser-rum'
import { Trans, t } from '@lingui/macro'
import * as Sentry from '@sentry/react'
import { Popover, Sidetab } from '@typeform/embed-react'
import { Suspense, lazy, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { AlertTriangle } from 'react-feather'
import { Route, Switch } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import AppHaveUpdate from 'components/AppHaveUpdate'
import ErrorBoundary from 'components/ErrorBoundary'
import Footer from 'components/Footer/Footer'
import Header from 'components/Header'
import TopBanner from 'components/Header/TopBanner'
import Loader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Popups from 'components/Popups'
import Web3ReactManager from 'components/Web3ReactManager'
import { APP_PATHS, BLACKLIST_WALLETS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useGlobalMixpanelEvents } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { useIsDarkMode } from 'state/user/hooks'
import DarkModeQueryParamReader from 'theme/DarkModeQueryParamReader'
import { isAddressString, shortenAddress } from 'utils'

import { RedirectDuplicateTokenIds } from './AddLiquidityV2/redirects'
import { RedirectPathToFarmNetwork } from './Farm/redirect'
import { RedirectPathToMyPoolsNetwork } from './Pool/redirect'
import { RedirectPathToPoolsNetwork } from './Pools/redirect'
import { RedirectPathToSwapNetwork } from './SwapV2/redirects'
import Verify from './Verify'

// Route-based code splitting
const Swap = lazy(() => import(/* webpackChunkName: 'swap-page' */ './Swap'))
const SwapV2 = lazy(() => import(/* webpackChunkName: 'swapv2-page' */ './SwapV2'))
const Bridge = lazy(() => import(/* webpackChunkName: 'bridge-page' */ './Bridge'))
const Pools = lazy(() => import(/* webpackChunkName: 'pools-page' */ './Pools'))
const Pool = lazy(() => import(/* webpackChunkName: 'my-pool-page' */ './Pool'))

const Farm = lazy(() => import(/* webpackChunkName: 'yield-page' */ './Farm'))

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
export default function App() {
  const { account, chainId, networkInfo } = useActiveWeb3React()

  useEffect(() => {
    if (account) {
      Sentry.setUser({ id: account })
      datadogRum.setUser({ id: account })
    }
  }, [account])

  useEffect(() => {
    if (chainId) {
      Sentry.setContext('network', {
        chainId: chainId,
        name: networkInfo.name,
      })
    }
  }, [chainId, networkInfo.name])

  const theme = useTheme()
  const isDarkTheme = useIsDarkMode()

  const { width } = useWindowSize()
  useGlobalMixpanelEvents()
  const { pathname } = window.location
  const showFooter = !pathname.includes(APP_PATHS.ABOUT)
  const feedbackId = isDarkTheme ? 'W5TeOyyH' : 'K0dtSO0v'

  return (
    <ErrorBoundary>
      <AppHaveUpdate />
      {width && width >= 768 ? (
        <Sidetab
          id={feedbackId}
          buttonText={t`Feedback`}
          buttonColor={theme.primary}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      ) : (
        <Popover
          id={feedbackId}
          customIcon={isDarkTheme ? 'https://i.imgur.com/iTOOKnr.png' : 'https://i.imgur.com/aPCpnGg.png'}
        />
      )}
      {(BLACKLIST_WALLETS.includes(isAddressString(chainId, account)) ||
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
                {isMobile ? shortenAddress(chainId, account || '', 10) : account}
              </Text>
            </Flex>
          </Flex>
        </Modal>
      )}

      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <>
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
                    <Route exact strict path={APP_PATHS.SWAP_LEGACY} component={Swap} />

                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.SWAP}/:network/:fromCurrency-to-:toCurrency`}
                      component={SwapV2}
                    />
                    <Route exact strict path={`${APP_PATHS.SWAP}/:network/:fromCurrency`} component={SwapV2} />
                    <Route exact strict path={`${APP_PATHS.SWAP}/:network`} component={SwapV2} />
                    <Route exact strict path={`${APP_PATHS.FIND_POOL}`} component={PoolFinder} />
                    <Route exact strict path={`${APP_PATHS.POOLS}/:network`} component={Pools} />
                    <Route exact strict path={`${APP_PATHS.POOLS}/:network/:currencyIdA`} component={Pools} />
                    <Route exact strict path={`${APP_PATHS.POOLS}`} component={RedirectPathToPoolsNetwork} />
                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.POOLS}/:network/:currencyIdA/:currencyIdB`}
                      component={Pools}
                    />
                    <Route exact strict path={`${APP_PATHS.FARMS}/:network`} component={Farm} />
                    <Route exact strict path={`${APP_PATHS.FARMS}`} component={RedirectPathToFarmNetwork} />
                    <Route exact strict path={`${APP_PATHS.MY_POOLS}/:network`} component={Pool} />
                    <Route exact strict path={`${APP_PATHS.MY_POOLS}`} component={RedirectPathToMyPoolsNetwork} />

                    <Route exact path={`${APP_PATHS.CLASSIC_CREATE_POOL}`} component={CreatePool} />
                    <Route
                      exact
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA`}
                      component={RedirectOldCreatePoolPathStructure}
                    />
                    <Route
                      exact
                      path={`${APP_PATHS.CLASSIC_CREATE_POOL}/:currencyIdA/:currencyIdB`}
                      component={RedirectCreatePoolDuplicateTokenIds}
                    />
                    <Route
                      exact
                      path={`${APP_PATHS.CLASSIC_ADD_LIQ}/:currencyIdA/:currencyIdB/:pairAddress`}
                      component={AddLiquidity}
                    />
                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.CLASSIC_REMOVE_POOL}/:currencyIdA/:currencyIdB/:pairAddress`}
                      component={RemoveLiquidity}
                    />
                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.ELASTIC_REMOVE_POOL}/:tokenId`}
                      component={ProAmmRemoveLiquidity}
                    />
                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.ELASTIC_CREATE_POOL}/:currencyIdA?/:currencyIdB?/:feeAmount?`}
                      component={RedirectDuplicateTokenIds}
                    />
                    <Route
                      exact
                      strict
                      path={`${APP_PATHS.ELASTIC_INCREASE_LIQ}/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?`}
                      component={IncreaseLiquidity}
                    />
                    <Route exact path={`${APP_PATHS.ABOUT}/kyberswap`} component={AboutKyberSwap} />
                    <Route exact path={`${APP_PATHS.ABOUT}/knc`} component={AboutKNC} />
                    <Route exact path={`${APP_PATHS.REFERRAL}`} component={CreateReferral} />
                    <Route exact path={`${APP_PATHS.DISCOVER}`} component={TrueSight} />
                    <Route exact path={`${APP_PATHS.BUY_CRYPTO}`} component={BuyCrypto} />
                    <Route exact path={`${APP_PATHS.CAMPAIGN}/:slug?`} component={Campaign} />
                    <Route exact path={`${APP_PATHS.BRIDGE}`} component={Bridge} />
                    <Route exact path={`${APP_PATHS.VERIFY}`} component={Verify} />

                    <Route component={RedirectPathToSwapNetwork} />
                  </Switch>
                </Web3ReactManager>
              </BodyWrapper>
              {showFooter && <Footer />}
            </Suspense>
          </AppWrapper>
        </>
      )}
    </ErrorBoundary>
  )
}
