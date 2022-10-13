import { AccountPage, AccountPageWithAccount } from './Account/AccountPage'
import { FomoPage, LimitOrders } from 'state/transactions/hooks'
import { HashRouter, Route, Switch } from 'react-router-dom'
import Header, { EmbedModel, useIsEmbedMode } from 'components/Header';
import React, { useState } from 'react'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects';
import { SelectiveChartWithPair, useIsMobile } from './Swap/SelectiveChartingPair';
import Swap, { CardWrapper, FixedContainer, ScrollableRow } from './Swap'
import { bscClient, client } from 'state/logs/utils'

import AddLiquidity from './AddLiquidity'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import {
  ApolloProvider
} from "@apollo/client";
import AppBody from './AppBody'
import Badge from 'components/Badge';
import { Bridge } from 'components/AccountDetails/Bridge';
import { ChartPage } from 'components/swap/ChartPage'
import CreateProposal from './CreateProposal'
import { DarkGreyCard } from 'components/Card'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import { DonationTracker } from 'components/LiquidityChartRangeInput/DonationTracker'
import ErrorBoundary from '../components/ErrorBoundary'
import { Flex } from 'rebass'
import { GainsTracker } from './GainsTracker/GainsTracker'
import { GelatoProvider } from "@gelatonetwork/limit-orders-react";
import { HoneyPotDetector } from './HoneyPotDetector'
import { KibaNftAlert } from 'components/NetworkAlert/AddLiquidityNetworkAlert';
import { LifetimeReflections } from './Swap/LifetimeReflections'
import Marquee from 'react-marquee-slider'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import { Mint } from 'components/Nft/mint';
import Polling from '../components/Header/Polling'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import PoolV2 from './Pool/v2'
import Popups from '../components/Popups'
import { PositionPage } from './Pool/PositionPage'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import { SelectiveChart } from './Swap/SelectiveCharting';
import { Suite } from './Suite/Suite';
import { SwapTokenForTokenComponent } from 'components/ChartSidebar/SwapTokenForTokenModal';
import SwapVolume from 'components/SwapVolume'
import { SwapVolumeContextProvider } from 'context/SwapVolumeContext';
import { TYPE } from 'theme'
import { TokenBalanceContextProvider } from 'utils/binance.utils'
import { TopTokenMovers } from 'components/swap/TopMovers'
import { Transactions } from './Vote/TransactionsPage'
import Vote from './Vote'
import VotePage from './Vote/VotePage'
import VotePageV2 from './Vote/VotePageV2'
import Web3ReactManager from '../components/Web3ReactManager'
import bg4 from '../assets/images/bg4.jpg'
import btok from '../assets/sponsors/btok2.svg'
import cart from '../assets/sponsors/cryptocart.svg'
import logo from '../assets/images/download.png'
import styled from 'styled-components/macro'
import { useDarkModeManager } from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import { useWeb3React } from '@web3-react/core'

const AppWrapper = styled.div<{ embedModel: EmbedModel }>`
  display: flex;
  flex-flow: column;
  background-size: cover;
  background-repeat: no-repeat;
  position: absolute;
  height: ${props => props.embedModel.embedMode ? 'auto' : '150vh'}; 
  width: 100%;
  background: url(${bg4}) ;

  align-items: flex-start;
  > * {
    font-family: 'Open Sans' !important;
  }
`

const BodyWrapper = styled.div<{ embed: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${props => props.embed ? '0px' : '120px 16px 0px 16px'};
  align-items: center;
  flex: 1;
  z-index: 1;
  margin-top:${(props) => props.embed ? '0px' : window.location.href.includes('charts') || window.location.href.includes('charting') ? '0.5rem' : '3rem'};

  ${({ theme, embed }) => theme.mediaWidth.upToSmall`
    padding:${embed ? '1px' : '6rem 16px 16px 16px'};
  `}


  ${({ theme, embed }) => theme.mediaWidth.upToExtraSmall`
  padding:${embed ? '1px' : '6rem 16px 16px 16px'};
  `}
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  flex-flow:column wrap;
  top: 0;
  z-index: 2;
  margin-bottom:2rem;
`

function TopLevelModals() {
  return null
}

const VideoWrapper = styled.div`
`


const StyledDiv = styled.div`
  font-family: 'Open Sans';
  font-size:14px;
`

export default function App() {
  const theme = useTheme()
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  
  const [style, setStyle] = useState({ background: '#333' })
  const Video = React.useMemo(() => {
    return (
      <VideoWrapper style={style} >
      </VideoWrapper>
    )
  }, [])
  const embedModel = useIsEmbedMode()
  const { chainId, account, library } = useWeb3React()
  const noop = () => { return };
  const innerWidth = window.innerWidth;
  const isMobile = useIsMobile()
  const GainsPage = (props: any) => <TokenBalanceContextProvider><VotePage {...props} /></TokenBalanceContextProvider>
  return (
    <ErrorBoundary>

      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <HashRouter>
        <SwapVolumeContextProvider chainId={chainId}>
          <Web3ReactManager>
            <GelatoProvider
              library={library}
              chainId={chainId ? chainId : 1}
              account={account ?? undefined}
              useDefaultTheme={false}
              useDarkMode={darkMode}
            >
              <ApolloProvider client={(!chainId || chainId && chainId === 1) ? client : chainId && chainId === 56 ? bscClient : client}>
                <AppWrapper embedModel={embedModel}>
                  <HeaderWrapper>
                    {(embedModel.embedMode == false || embedModel.showTrending) && <TopTokenMovers />}
                    {embedModel.embedMode == false && <Header />}
                  </HeaderWrapper>

                  {/* 
                  <div style={{position:'absolute', top:'25%', left:'5%'}}>
                    <img style={{maxWidth:200}} src={'https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-07-22.25.47.jpeg'} />
                </div>
                  <div style={{position:'absolute', top:'25%', right:'5%'}}>
                      <img style={{maxWidth:200}} src={'https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-07-22.25.47.jpeg'} />
                  </div> 
                */}
                  <BodyWrapper embed={embedModel.embedMode}>
                    <SwapTokenForTokenComponent />
                    <Popups />
                    {!isMobile && <>
                      <Polling />
                      <SwapVolume />
                    </>}
                    <TopLevelModals />
                    {<KibaNftAlert />}
                    <Switch>
                      <Route exact strict path="/nfts" component={Mint} />
                      <Route exact strict path="/nfts/mint/:referrer" component={Mint} />
                      <Route exact strict path="/reflections" component={LifetimeReflections} />
                      <Route exact strict path="/details" component={AccountPage} />
                      <Route exact strict path="/details/:account" component={AccountPageWithAccount} />
                      <Route exact strict path="/limit" component={LimitOrders} />

                      {/* Chart Pages Routes */}

                      {/* Entry page routes, this will show the search / select and recently viewed. All uses same component */}
                      <Route exact strict path="/selective-charting" component={SelectiveChartWithPair} />
                      <Route exact strict path="/selective-charts" component={SelectiveChartWithPair} />

                      {/* Longer routes, with more parameters, kind of bad for users to have to share. Working on removing these */}
                      <Route exact strict path="/selective-charting/:tokenAddress/:tokenSymbol/:name/:decimals" component={SelectiveChart} />
                      <Route exact strict path="/selective-charting/:tokenAddress/:tokenSymbol/:name/:decimals/:pairAddress" component={SelectiveChart} />
                      <Route exact strict path="/selective-charts/:tokenAddress/:tokenSymbol/:name" component={SelectiveChart} />
                      <Route exact strict path="/selective-charts/:tokenAddress/:tokenSymbol/:name/:decimals" component={SelectiveChart} />
                      <Route exact strict path="/selective-charts/:tokenAddress/:tokenSymbol/:name/:decimals/:pairAddress" component={SelectiveChart} />

                      {/* Simpler route, takes only the pair address, the rest is computed from that */}
                      <Route exact strict path="/selective-charting/:network/:pairAddress" component={SelectiveChartWithPair} />
                      <Route exact strict path="/selective-charts/:network/:pairAddress" component={SelectiveChartWithPair} />
                      <Route exact strict path="/charts/:network/:pairAddress" component={SelectiveChartWithPair} />
                      <Route exact strict path="/charts" component={SelectiveChartWithPair} />

                      <Route exact strict path="/bridge" component={Bridge} />
                      {/* End Chart Pages Routes */}

                      <Route exact strict path="/fomo" component={FomoPage} />
                      <Route exact strict path="/donation-tracker" component={DonationTracker} />
                      <Route exact strict path="/tracker" component={GainsTracker} />
                      <Route exact strict path="/suite" component={Suite} />
                      <Route exact strict path="/transactions" component={Transactions} />
                      <Route exact strict path="/gains" component={GainsPage} />
                      <Route exact strict path="/honeypot-checker" component={HoneyPotDetector} />
                      <Route exact strict path="/dashboard" component={VotePage} />
                      <Route exact strict path="/vote" component={Vote} />
                      <Route exact strict path="/vote/:id" component={VotePageV2} />
                      <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                      <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                      <Route exact strict path="/swap" component={Swap} />
                      <Route exact strict path="/pool/v2/find" component={PoolFinder} />
                      <Route exact strict path="/pool/v2" component={PoolV2} />
                      <Route exact strict path="/pool" component={Pool} />
                      <Route exact strict path="/pool/:tokenId" component={PositionPage} />
                      <Route exact strict path="/add/v2/:currencyIdA?/:currencyIdB?" component={RedirectDuplicateTokenIdsV2} />
                      <Route
                        exact
                        strict
                        path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                        component={RedirectDuplicateTokenIds}
                      />

                      <Route
                        exact
                        strict
                        path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                        component={AddLiquidity}
                      />

                      <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                      <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} />

                      <Route exact strict path="/migrate/v2" component={MigrateV2} />
                      <Route exact strict path="/migrate/v2/:address" component={MigrateV2Pair} />

                      <Route exact strict path="/proposals" component={CreateProposal} />
                      <Route exact strict path="/charts" component={ChartPage} />

                      <Route component={RedirectPathToSwapOnly} />
                    </Switch>
                    {embedModel.embedMode == false && (
                      <AppBody style={{
                        boxShadow:
                          'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                        position: 'relative',
                        padding: '9px 14px',
                        justifyContent: 'end',
                        backgroundColor: theme.bg0,
                        color: theme.text1,
                        height: 'flex',
                        width: 'flex',
                        minWidth: '45%'
                      }}>
                        <StyledDiv style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '10px', paddingTop: '10px' }}>Kibaswap Featured Sponsors
                        </StyledDiv>
                        <Marquee direction={'ltr'}
                          resetAfterTries={200}
                          scatterRandomly={false}
                          onInit={noop}
                          onFinish={noop}
                          velocity={10}>
                          <></>
                          <FixedContainer style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: 'transparent', width: '100%' }} gap="xs">
                            <ScrollableRow style={{ paddingTop: 10, paddingBottom: 10 }} background={theme.chartSidebar}>
                              {[
                                {
                                  title: "Kiba Inu",
                                  img: logo,
                                  text: "Kiba Inu is a token infused with Kiba Swap",
                                  link: '#',
                                  style: {}
                                },
                                {
                                  title: "CryptoCart",
                                  img: cart,
                                  text: "Learn more about Crypto Cart",
                                  link: 'https://cryptocart.cc/',
                                  style: {}
                                },
                                {
                                  title: "Kiba NFTs",
                                  img: `https://openseauserdata.com/files/260d4d4d0ee4a561f25d2d61a4bc25c9.png`,
                                  text: "View the Genesis NFT page",
                                  link: '/#/nfts',
                                  style: { borderRadius: '60px' }
                                },
                                {
                                  title: "Btok",
                                  img: btok,
                                  text: "Learn more about BTok",
                                  link: 'https://www.btok.com/',
                                  style: {}
                                }].map((sponsor) => (
                                  <CardWrapper title={sponsor.text} key={sponsor.title} href={sponsor.link}>
                                    <DarkGreyCard style={{height:90,  backgroundColor: !darkMode ? '#eee' : '', padding: 3 }}>
                                      <Flex flexDirection="column" alignItems={'center'} justifyContent={'center'}>
                                        <Flex alignItems={'center'} flexDirection={'row'}>

                                        </Flex>
                                        <Flex style={{ height: 'flex', padding: '5' }} alignItems={'center'} justifyContent={'space-between'}>
                                          <a href={sponsor.link}>
                                            <img style={{ maxWidth: 80, ...sponsor?.style }} src={sponsor.img} />
                                          </a>
                                          <TYPE.small alignItems={'center'} justifyContent={'center'}></TYPE.small>
                                        </Flex>
                                      </Flex>
                                    </DarkGreyCard>
                                  </CardWrapper>
                                ))}
                            </ScrollableRow>
                          </FixedContainer>
                        </Marquee>
                      </AppBody>)}

                    {embedModel.embedMode == true && (
                      <Badge style={{ borderRadius: 0, width: '100%', background: embedModel?.theme == 'dark' ? "#222" : '#fff' }}>
                        <a href={'https://kiba.app'}>
                          <div style={{ display: 'flex', columnGap: 2.5, alignItems: 'center', justifyContent: "center", flexFlow: 'row wrap' }}>
                            <TYPE.italic>Tracked by </TYPE.italic>
                            <img src={'https://kiba.app/static/media/download.e893807d.png'} style={{ maxWidth: 40 }} />
                            <TYPE.main>KIBA</TYPE.main>
                            <TYPE.italic style={{ color: theme.text1 }}>CHARTS</TYPE.italic>
                          </div>
                        </a>
                      </Badge>
                    )}


                  </BodyWrapper>

                </AppWrapper>
              </ApolloProvider>
            </GelatoProvider>

          </Web3ReactManager>
        </SwapVolumeContextProvider>
      </HashRouter>
    </ErrorBoundary>
  )
}