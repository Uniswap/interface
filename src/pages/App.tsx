import { ApolloProvider } from '@apollo/client'
import { ChainId } from 'dxswap-sdk'
import React, { Suspense, useContext } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled, { ThemeContext } from 'styled-components'
import { defaultSubgraphClient, subgraphClients } from '../apollo/client'
import Header from '../components/Header'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds, RedirectOldAddLiquidityPathStructure } from './AddLiquidity/redirects'
import Pools from './Pools'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import Pair from './Pools/Pair'
import CreateLiquidityMining from './LiquidityMining/Create'
import { useActiveWeb3React } from '../hooks'
import { SkeletonTheme } from 'react-loading-skeleton'
import MyPairs from './Pools/Mine'
import LiquidityMiningCampaign from './Pools/LiquidityMiningCampaign'
import NetworkWarningModal from '../components/NetworkWarningModal'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { DisclaimerBar } from '../components/DisclaimerBar'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  z-index: 4;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 172px);
  width: 100%;
  padding-top: 60px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 2rem;
  `};

  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`
export default function App() {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  return (
    <Suspense fallback={null}>
      <SkeletonTheme color={theme.bg3} highlightColor={theme.bg2}>
        <ApolloProvider client={subgraphClients[chainId as ChainId] || defaultSubgraphClient}>
          <NetworkWarningModal />
          <Route component={DarkModeQueryParamReader} />
          <AppWrapper>
            <DisclaimerBar />
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <BodyWrapper>
              <ToastContainer
                draggable={false}
                className="custom-toast-root"
                toastClassName="custom-toast-container"
                bodyClassName="custom-toast-body"
                position="top-right"
                transition={Slide}
              />
              <Web3ReactManager>
                <Switch>
                  <Route exact strict path="/swap" component={Swap} />
                  <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                  <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                  <Route exact strict path="/pools" component={Pools} />
                  <Route exact strict path="/pools/mine" component={MyPairs} />
                  <Route exact strict path="/pools/:currencyIdA/:currencyIdB" component={Pair} />
                  <Route
                    exact
                    strict
                    path="/pools/:currencyIdA/:currencyIdB/:liquidityMiningCampaignId"
                    component={LiquidityMiningCampaign}
                  />
                  <Route exact strict path="/create" component={AddLiquidity} />
                  <Route exact path="/add" component={AddLiquidity} />
                  {/* <Route exact strict path="/governance" component={GovPages} /> */}
                  {/* <Route exact strict path="/governance/:asset/pairs" component={GovPages} /> */}
                  <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                  <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                  <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                  <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                  <Route exact strict path="/liquidity-mining/create" component={CreateLiquidityMining} />
                  <Route component={RedirectPathToSwapOnly} />
                </Switch>
              </Web3ReactManager>
              <Marginer />
            </BodyWrapper>
          </AppWrapper>
        </ApolloProvider>
      </SkeletonTheme>
    </Suspense>
  )
}
