import { Trade, TradeType } from '@teleswap/sdk'
import useThemedContext from 'hooks/useThemedContext'
import React, { useEffect, useState } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components'

import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'
import ArrowHGreen from 'assets/svg/arrowHGreen.svg'
import ArrowHLoneLine from 'assets/svg/arrowHLoneLine.svg'
import LineVIcon from 'assets/images/tele/lineV.png'
import TeleRouteIcon from 'assets/svg/teleRoute.svg'
import arrowShowRoute from 'assets/svg/arrowShowRoute.svg'
import BigNumber from "bignumber.js";
const axios = require('axios').default;

const InfoLink = styled(ExternalLink)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.bg3};
  padding: 6px 6px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text1};
`

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  const theme = useThemedContext()
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  return (
    <>
      <AutoColumn style={{ padding: '0 16px', color: '#D7DCE0' }}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={'.4rem'} fontWeight={400} color={theme.text2}>
              {isExactIn ? 'Minimum received' : 'Maximum sold'}
            </TYPE.black>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1} fontSize={'.4rem'}>
              {isExactIn
                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
                '-'
                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ??
                '-'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={'.4rem'} fontWeight={400} color={theme.text2}>
              Price Impact
            </TYPE.black>
            <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={'.4rem'} fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
            <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TYPE.black fontSize={'.4rem'} color={theme.text1}>
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

const RouteStyled = styled(Box)`
  max-height: 0;
  transition: all 0.5s;
  margin-top: .8rem !important;
  border: 1px solid ${({ theme }) => theme.bg3};
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: .4rem;
  color: rgba(255, 255, 255, 0.8);
  /* height: 5.7rem; */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: .5rem;
  padding: .7rem .9rem;
  .LineVIcon {
    height: 2.6rem;
    width: 1px;
    margin: 0 .5rem;
  }
  .leftTokenImg,.rightTokenImg {
    width: 1.2rem;
    height: 1.2rem;
  }
`
const RouteCellStyled = styled(Box)`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  :nth-of-type(2){
    margin-top: .9rem !important;
  }
  .routeCellBlock {
    .ArrowHLoneLine {
      width: 3rem;
      height: .6rem;
      margin: 2px 0;
    }
  }
  .tokenImgWrap {
    background: rgba(57, 225, 186, 0.1);
    border-radius: .5rem;
    padding: .2rem;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    position: relative;
    width: 2rem;
    height: 1.3rem;
    img {
      width: 1.1rem;
      height: auto;
    }
    img:nth-of-type(1) {
      margin-right: 10px;
    }
    img:nth-of-type(2) {
      position: absolute;
      right: 3px;
      z-index: -1;
    }
  }
  .justArrowHead {
    width: .4rem;
    height: .4rem;
  }
`
const RouteAccordionStyled = styled(Box)`
  display: inline-block;
  transition: all 0.3s;
  margin-left: .4rem;
  font-size: 16px;
`
export interface AdvancedSwapDetailsProps {
  trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useThemedContext()
  const [showRouterDetail, setShowRouterDetail] = useState(false)
  const [allowedSlippage] = useUserSlippageTolerance()
  const [routeData, setRouteData]: any = useState(null)
  const showRoute = Boolean(trade && trade.route.path.length > 2)
  let tradeTemp: any = trade || { route: {} }
  let amountString = tradeTemp?.inputAmount?.toExact() || tradeTemp?.inputAmount?.toSignificant(6) || ''
  window['axiosClient'] = axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = 'https://teleport-routing.qa.davionlabs.com/quote'
        if (!tradeTemp || !tradeTemp.hasOwnProperty('inputAmount') || !tradeTemp.hasOwnProperty('route')) {
          console.log('tradeTemp lack key', tradeTemp)
          return
        }
        let symbol = tradeTemp?.inputAmount?.token?.symbol
        let decimal = tradeTemp?.inputAmount?.token?.decimals
        let amount = new BigNumber(amountString).shiftedBy(decimal).toNumber()
        let params = {
          tokenInAddress: tradeTemp?.route.input?.address,
          tokenInChainId: tradeTemp?.route.input?.chainId,
          tokenOutAddress: tradeTemp?.route.output?.address,
          tokenOutChainId: tradeTemp?.route.output?.chainId,
          amount,
          type: "exactIn",
          protocols: "v2",
        }
        // let res2 = await axios.post(url, params)
        // console.log(res2)
        let res: any = {
          "blockNumber": "1466190",
          "amount": "2000000000000000000000",
          "amountDecimals": "2000000000000000",
          "quote": "1014077544487071087",
          "quoteDecimals": "1.014077544487071087",
          "quoteGasAdjusted": "1014077544486936087",
          "quoteGasAdjustedDecimals": "1.014077544486936087",
          "gasUseEstimateQuote": "135000",
          "gasUseEstimateQuoteDecimals": "0.000000000000135",
          "gasUseEstimate": "135000",
          "gasUseEstimateUSD": "0.00000000016943367",
          "gasPriceWei": "1",
          "route": [
            [
              {
                "type": "v2-pool",
                "address": "0xE809D2aFa8eA065af826BE321937bf89a72cd9DE",
                "tokenIn": {
                  "chainId": 420,
                  "decimals": "6",
                  "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                  "symbol": "USDT"
                },
                "tokenOut": {
                  "chainId": 420,
                  "decimals": "18",
                  "address": "0x4200000000000000000000000000000000000006",
                  "symbol": "WETH"
                },
                "reserve0": {
                  "token": {
                    "chainId": 420,
                    "decimals": "18",
                    "address": "0x4200000000000000000000000000000000000006",
                    "symbol": "WETH"
                  },
                  "quotient": "3035000000000000000"
                },
                "reserve1": {
                  "token": {
                    "chainId": 420,
                    "decimals": "6",
                    "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                    "symbol": "USDT"
                  },
                  "quotient": "3973778335000057662621"
                },
                "amountIn": "2000000000000000000000",
                "amountOut": "2000000000000000000000",
                "stable": false
              },
              {
                "type": "v2-pool",
                "address": "0xE809D2aFa8eA065af826BE321937bf89a72cd9DE",
                "tokenIn": {
                  "chainId": 420,
                  "decimals": "6",
                  "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                  "symbol": "WETH"
                },
                "tokenOut": {
                  "chainId": 420,
                  "decimals": "18",
                  "address": "0x4200000000000000000000000000000000000006",
                  "symbol": "USDC"
                },
                "reserve0": {
                  "token": {
                    "chainId": 420,
                    "decimals": "18",
                    "address": "0x4200000000000000000000000000000000000006",
                    "symbol": "WETH"
                  },
                  "quotient": "3035000000000000000"
                },
                "reserve1": {
                  "token": {
                    "chainId": 420,
                    "decimals": "6",
                    "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                    "symbol": "USDC"
                  },
                  "quotient": "3973778335000057662621"
                },
                "amountIn": "2000000000000000000000",
                "amountOut": "2000000000000000000000",
                "stable": false
              }
            ],
            [
              {
                "type": "v2-pool",
                "address": "0xE809D2aFa8eA065af826BE321937bf89a72cd9DE",
                "tokenIn": {
                  "chainId": 420,
                  "decimals": "6",
                  "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                  "symbol": "USDT"
                },
                "tokenOut": {
                  "chainId": 420,
                  "decimals": "18",
                  "address": "0x4200000000000000000000000000000000000006",
                  "symbol": "WETH"
                },
                "reserve0": {
                  "token": {
                    "chainId": 420,
                    "decimals": "18",
                    "address": "0x4200000000000000000000000000000000000006",
                    "symbol": "WETH"
                  },
                  "quotient": "3035000000000000000"
                },
                "reserve1": {
                  "token": {
                    "chainId": 420,
                    "decimals": "6",
                    "address": "0x5986C8FfADCA9cee5C28A85cC3d4F335aab5Dc90",
                    "symbol": "USDT"
                  },
                  "quotient": "3973778335000057662621"
                },
                "amountIn": "2000000000000000000000",
                "amountOut": "2000000000000000000000",
                "stable": false
              }
            ]
          ],
          "percents": [
            20,
            80
          ],
          "quoteId": ""
        }
        setRouteData(res)
      } catch (error) {
        console.log('AdvancedSwapDetails error', error)
      }
    }
    fetchData()
    return () => {
    }
  }, [amountString])
  return (
    <AutoColumn gap="0px">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          {showRoute && (
            <>
              <RowBetween style={{ padding: '0 16px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                    Route
                  </TYPE.black>
                  <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
                </span>
                <SwapRoute trade={trade} />
                <RouteAccordionStyled onClick={() => setShowRouterDetail(!showRouterDetail)} sx={{ marginLeft: ".5rem" }}>
                  {/* {'>'} */}
                  <img src={arrowShowRoute} alt="" style={showRouterDetail ? { transform: 'rotate(180deg)', width: '12px', height: '12px', cursor: 'pointer' } : { width: '12px', height: '12px', cursor: 'pointer' }} />
                </RouteAccordionStyled>
              </RowBetween>
              <RouteStyled sx={showRouterDetail ? { maxHeight: 'unset' } : { display: 'none' }}>
                <img className="leftTokenImg" src={TeleRouteIcon} alt="" />
                <img className="LineVIcon" src={LineVIcon} alt="" />
                <div>
                  {
                    // @ts-ignore
                    routeData && routeData.hasOwnProperty('route') && routeData.route.map((item, index) => (
                      <RouteCellStyled key={index}>
                        {item.map((routeItem, routeItemIndex) => (
                          <>
                            <div className="routeCellBlock ColumnStartCenter" style={{ marginRight: '.5rem' }}>
                              {
                                routeItemIndex == 0 ? <span>{routeData.percents[index]}%</span> : <span>　</span>
                              }
                              <img className="ArrowHLoneLine" src={ArrowHLoneLine} alt="" />
                              <span style={{ border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', padding: '.1rem .3rem' }}>{routeItem.stable ? "Stable" : "Volatile"}</span>
                            </div>
                            <div className="tokenImgWrap" style={{ marginRight: '.5rem' }}>
                              <img src={TeleRouteIcon} alt="" />
                              <img src={TeleRouteIcon} alt="" />
                            </div>
                          </>
                        ))
                        }
                        {/* <div className="routeCellBlock ColumnStartCenter" style={{ marginRight: '.5rem' }}>
                          <span>　</span>
                          <img className="ArrowHLoneLine" src={ArrowHLoneLine} alt="" />
                          <span>Stable</span>
                        </div>
                        <div className="tokenImgWrap" style={{ marginRight: '.4rem' }}>
                          <img src={TeleRouteIcon} alt="" />
                          <img src={TeleRouteIcon} alt="" />
                        </div> */}
                        <img className="justArrowHead" src={ArrowHGreen} alt="" />
                      </RouteCellStyled>
                    ))
                  }
                </div>
                <img className="LineVIcon" src={LineVIcon} alt="" />
                <img className="rightTokenImg" src={TeleRouteIcon} alt="" />
              </RouteStyled>
            </>
          )}
          {/* {!showRoute && (
            <AutoColumn style={{ padding: '12px 16px 0 16px' }}>
              <InfoLink
                href={'https://info.uniswap.org/pair/' + trade.route.pairs[0].liquidityToken.address}
                target="_blank"
              >
                View pair analytics ↗
              </InfoLink>
            </AutoColumn>
          )} */}
        </>
      )}
    </AutoColumn>
  )
}
