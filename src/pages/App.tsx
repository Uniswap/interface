import React, { lazy, Suspense } from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { ApolloProvider } from '@apollo/client'

import { defaultExchangeClient, exchangeCient } from 'apollo/client'
import Loader from 'components/LocalLoader'
import Header from '../components/Header'
import URLWarning from '../components/Header/URLWarning'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import Utilities from 'components/Footer/Utilities'
import PoweredBy from 'components/Footer/PoweredBy'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import { BLACKLIST_WALLETS } from '../constants'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from 'libs/sdk/src'
import { useActiveNetwork } from 'hooks/useActiveNetwork'

import KNCPrice from 'components/KNCPrice'

// Route-based code splitting
const Pools = lazy(() => import(/* webpackChunkName: 'pools-page' */ './Pools'))
const Pool = lazy(() => import(/* webpackChunkName: 'pool-page' */ './Pool'))
const Yield = lazy(() => import(/* webpackChunkName: 'yield-page' */ './Yield'))
const PoolFinder = lazy(() => import(/* webpackChunkName: 'pool-finder-page' */ './PoolFinder'))
const PoolFinderExternal = lazy(() =>
  import(/* webpackChunkName: 'pool-finder-external-page' */ './PoolFinder/PoolFinderExternal')
)
const Migration = lazy(() => import(/* webpackChunkName: 'migration-page' */ './Pool/lp'))
const AddLiquidity = lazy(() => import(/* webpackChunkName: 'add-liquidity-page' */ './AddLiquidity'))
const RemoveLiquidity = lazy(() => import(/* webpackChunkName: 'remove-liquidity-page' */ './RemoveLiquidity'))
const MigrateLiquidityUNI = lazy(() =>
  import(/* webpackChunkName: 'migrate-uni-page' */ './RemoveLiquidity/migrate_uni')
)
const MigrateLiquiditySUSHI = lazy(() =>
  import(/* webpackChunkName: 'migrate-sushi-page' */ './RemoveLiquidity/migrate_sushi')
)
const About = lazy(() => import(/* webpackChunkName: 'about-page' */ './Static/About'))
const RedirectToAddLiquidity = lazy(() =>
  import(/* webpackChunkName: 'redirect-add-liquidity-page' */ './AddLiquidity/redirects')
)
const RedirectDuplicateTokenIds = lazy(() =>
  import(/* webpackChunkName: 'redirect-duplicate-token-ids-page' */ './AddLiquidity/RedirectDuplicateTokenIds')
)
const RedirectOldAddLiquidityPathStructure = lazy(() =>
  import(
    /* webpackChunkName: 'redirect-old-add-liquidity-path-structure-page' */ './AddLiquidity/RedirectOldAddLiquidityPathStructure'
  )
)
const RedirectOldRemoveLiquidityPathStructure = lazy(() =>
  import(/* webpackChunkName: 'redirect-old-remove-liquidity-path-structure-page' */ './RemoveLiquidity/redirects')
)

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

const BodyWrapper = styled.div<{ isAboutpage?: boolean }>`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
`

const UtilitiesWrapper = styled.div<{ isAboutpage?: boolean }>`
  display: ${({ isAboutpage }) => (isAboutpage ? 'none' : 'flex')};
  justify-content: space-between;
  width: 100%;
  height: fit-content;
  padding: 12px 16px 16px;
  z-index: -2;
  opacity: 0.8;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }

  @media only screen and (min-width: 768px) {
    padding: 16px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 16px 32px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 16px 215px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 16px 252px;
  }
`

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  useActiveNetwork()
  const { account, chainId } = useActiveWeb3React()
  const aboutPage = useRouteMatch('/about')
  const apolloClient = exchangeCient[chainId as ChainId]

  return (
    <>
      {(!account || !BLACKLIST_WALLETS.includes(account)) && (
        <ApolloProvider client={apolloClient || defaultExchangeClient}>
          <Route component={DarkModeQueryParamReader} />
          <AppWrapper>
            <URLWarning />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <Suspense fallback={<Loader />}>
              <BodyWrapper isAboutpage={aboutPage?.isExact}>
                <Popups />
                <UtilitiesWrapper isAboutpage={aboutPage?.isExact}>
                  <KNCPrice />
                  <Utilities />
                </UtilitiesWrapper>
                <PoweredBy />
                <Web3ReactManager>
                  <Switch>
                    <Route exact strict path="/swap" component={Swap} />
                    <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                    <Route exact strict path="/find" component={PoolFinder} />
                    <Route exact strict path="/findExternal" component={PoolFinderExternal} />
                    <Route exact strict path="/pools" component={Pools} />
                    <Route exact strict path="/pools/:currencyIdA" component={Pools} />
                    <Route exact strict path="/pools/:currencyIdA/:currencyIdB" component={Pools} />
                    <Route exact strict path="/farms" component={Yield} />
                    <Route exact strict path="/myPools" component={Pool} />
                    <Route exact strict path="/migration" component={Migration} />
                    <Route exact path="/add" component={AddLiquidity} />
                    <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                    <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                    <Route
                      exact
                      path="/add/:currencyIdA/:currencyIdB/:pairAddress"
                      component={RedirectDuplicateTokenIds}
                    />
                    <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                    <Route
                      exact
                      strict
                      path="/remove/:currencyIdA/:currencyIdB/:pairAddress"
                      component={RemoveLiquidity}
                    />
                    <Route exact strict path="/create" component={RedirectToAddLiquidity} />
                    <Route exact path="/create" component={AddLiquidity} />
                    <Route exact path="/create/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                    <Route exact path="/create/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                    <Route
                      exact
                      path="/add/:currencyIdA/:currencyIdB/:pairAddress"
                      component={RedirectDuplicateTokenIds}
                    />
                    <Route
                      exact
                      strict
                      path="/migrateSushi/:currencyIdA/:currencyIdB"
                      component={MigrateLiquiditySUSHI}
                    />
                    <Route exact strict path="/migrate/:currencyIdA/:currencyIdB" component={MigrateLiquidityUNI} />
                    <Route exact path="/about" component={About} />
                    <Route component={RedirectPathToSwapOnly} />
                  </Switch>
                </Web3ReactManager>
                <Marginer />
              </BodyWrapper>
            </Suspense>
          </AppWrapper>
        </ApolloProvider>
      )}
    </>
  )
}
