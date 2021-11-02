import React, { lazy, Suspense, useEffect } from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { ApolloProvider } from '@apollo/client'

import { defaultExchangeClient } from 'apollo/client'
import Loader from 'components/LocalLoader'
import Header from '../components/Header'
import URLWarning from '../components/Header/URLWarning'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import PoweredBy from 'components/Footer/PoweredBy'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import SwapV2 from './SwapV2'
import { BLACKLIST_WALLETS } from '../constants'
import { useActiveWeb3React } from 'hooks'
import { useExchangeClient } from 'state/application/hooks'
import OnlyEthereumRoute from 'components/OnlyEthereumRoute'
import { ChainId } from '@dynamic-amm/sdk'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'state'
import { setGasPrice } from 'state/application/actions'

// Route-based code splitting
const Pools = lazy(() => import(/* webpackChunkName: 'pools-page' */ './Pools'))
const Pool = lazy(() => import(/* webpackChunkName: 'pool-page' */ './Pool'))
const Yield = lazy(() => import(/* webpackChunkName: 'yield-page' */ './Yield'))
const PoolFinder = lazy(() => import(/* webpackChunkName: 'pool-finder-page' */ './PoolFinder'))
const PoolFinderExternal = lazy(() =>
  import(/* webpackChunkName: 'pool-finder-external-page' */ './PoolFinder/PoolFinderExternal')
)
const Migration = lazy(() => import(/* webpackChunkName: 'migration-page' */ './Pool/lp'))

const CreatePool = lazy(() => import(/* webpackChunkName: 'create-pool-page' */ './CreatePool'))
const RedirectCreatePoolDuplicateTokenIds = lazy(() =>
  import(
    /* webpackChunkName: 'redirect-create-pool-duplicate-token-ids-page' */ './CreatePool/RedirectDuplicateTokenIds'
  )
)
const RedirectOldCreatePoolPathStructure = lazy(() =>
  import(
    /* webpackChunkName: 'redirect-old-create-pool-path-structure-page' */ './CreatePool/RedirectOldCreatePoolPathStructure'
  )
)

const AddLiquidity = lazy(() => import(/* webpackChunkName: 'add-liquidity-page' */ './AddLiquidity'))

const RemoveLiquidity = lazy(() => import(/* webpackChunkName: 'remove-liquidity-page' */ './RemoveLiquidity'))

const MigrateLiquidityUNI = lazy(() =>
  import(/* webpackChunkName: 'migrate-uni-page' */ './RemoveLiquidity/migrate_uni')
)
const MigrateLiquiditySUSHI = lazy(() =>
  import(/* webpackChunkName: 'migrate-sushi-page' */ './RemoveLiquidity/migrate_sushi')
)
const About = lazy(() => import(/* webpackChunkName: 'about-page' */ './Static/About'))

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

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  const { account, chainId } = useActiveWeb3React()
  const aboutPage = useRouteMatch('/about')
  const apolloClient = useExchangeClient()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    const fetchGas = (chain: string) => {
      fetch(process.env.REACT_APP_KRYSTAL_API + `/${chain}/v2/swap/gasPrice`)
        .then(res => res.json())
        .then(json => {
          dispatch(setGasPrice(!!json.error ? undefined : json.gasPrice))
        })
        .catch(e => {
          dispatch(setGasPrice(undefined))
        })
    }

    let interval: any = null
    const chain =
      chainId === ChainId.MAINNET
        ? 'ethereum'
        : chainId === ChainId.BSCMAINNET
        ? 'bsc'
        : chainId === ChainId.AVAXMAINNET
        ? 'avalanche'
        : chainId === ChainId.MATIC
        ? 'polygon'
        : ''
    if (!!chain) {
      fetchGas(chain)
      interval = setInterval(() => fetchGas(chain), 30000)
    } else dispatch(setGasPrice(undefined))
    return () => {
      clearInterval(interval)
    }
  }, [chainId, dispatch])

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
                <PoweredBy />
                <Web3ReactManager>
                  <Switch>
                    <Route exact strict path="/swap-legacy" component={Swap} />
                    <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                    <Route exact strict path="/swap" component={SwapV2} />
                    <Route exact strict path="/find" component={PoolFinder} />
                    <OnlyEthereumRoute exact path="/findExternal" component={PoolFinderExternal} />
                    <Route exact strict path="/pools" component={Pools} />
                    <Route exact strict path="/pools/:currencyIdA" component={Pools} />
                    <Route exact strict path="/pools/:currencyIdA/:currencyIdB" component={Pools} />
                    <Route exact strict path="/farms" component={Yield} />
                    <Route exact strict path="/myPools" component={Pool} />
                    <OnlyEthereumRoute exact path="/migration" component={Migration} />

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
