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
import BigNumber from 'bignumber.js'
import axios from 'axios'

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
      <AutoColumn className="text-detail" style={{ padding: '0 16px', color: '#D7DCE0' }} gap="0.4rem">
        <RowBetween>
          <RowFixed>
            <TYPE.black fontWeight={400} color={theme.text2}>
              {isExactIn ? 'Minimum received' : 'Maximum sold'}
            </TYPE.black>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1}>
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
            <TYPE.black fontWeight={400} color={theme.text2}>
              Price Impact
            </TYPE.black>
            <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
            <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TYPE.black color={theme.text1}>
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
  margin-top: 0.8rem !important;
  border: 1px solid ${({ theme }) => theme.bg3};
  display: flex;
  justify-content: space-around;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  /* height: 5.7rem; */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.7rem 0.9rem;
  .LineVIcon {
    height: 2.6rem;
    width: 1px;
    margin: 0 0.5rem;
  }
  .leftTokenImg,
  .rightTokenImg {
    width: 1.2rem;
    height: 1.2rem;
  }
`
const RouteCellStyled = styled(Box)`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  :nth-of-type(2) {
    margin-top: 0.9rem !important;
  }
  .routeCellBlock {
    .ArrowHLoneLine {
      width: 3rem;
      height: 0.6rem;
      margin: 2px 0;
    }
  }
  .tokenImgWrap {
    background: rgba(57, 225, 186, 0.1);
    border-radius: 0.5rem;
    padding: 0.2rem;
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
    width: 0.4rem;
    height: 0.4rem;
  }
`
const RouteAccordionStyled = styled(Box)`
  display: inline-block;
  transition: all 0.3s;
  margin-left: 0.4rem;
`
export interface AdvancedSwapDetailsProps {
  trade?: Trade
}
if (window) {
  window['axiosClient'] = axios
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useThemedContext()
  const [showRouterDetail, setShowRouterDetail] = useState(false)
  const [allowedSlippage] = useUserSlippageTolerance()
  const [routeData, setRouteData]: any = useState(null)
  // const showRoute = Boolean(trade && trade.route.path.length > 2)
  const showRoute = Boolean(trade && trade.route.path.length >= 2)
  const tradeTemp: any = trade || { route: {} }
  const inputName = tradeTemp?.inputAmount?.currency?.name || ''
  const outputName = tradeTemp?.outputAmount?.currency?.name || ''
  const amountString = tradeTemp?.inputAmount?.toExact() || tradeTemp?.inputAmount?.toSignificant(6) || ''
  useEffect(() => {
    ;(async () => {
      try {
        if (
          !tradeTemp ||
          !tradeTemp.hasOwnProperty('inputAmount') ||
          !tradeTemp.hasOwnProperty('route') ||
          !inputName ||
          !outputName
        ) {
          console.log('tradeTemp lack key', tradeTemp)
          return
        }
        const decimal = tradeTemp?.inputAmount?.token?.decimals
        const amount = new BigNumber(amountString).shiftedBy(decimal).toNumber()
        const params = {
          tokenInAddress: tradeTemp?.route.input?.address,
          tokenInChainId: tradeTemp?.route.input?.chainId,
          tokenOutAddress: tradeTemp?.route.output?.address,
          tokenOutChainId: tradeTemp?.route.output?.chainId,
          amount,
          type: 'exactIn',
          protocols: 'v2'
        }
        const data = JSON.stringify(params)
        const url = 'https://teleport-routing.qa.davionlabs.com/quote'
        const config = {
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          data
        }
        axios(config)
          .then(function (response) {
            setRouteData(response.data)
          })
          .catch(function (error) {
            console.log(error)
          })
      } catch (error) {
        console.log('AdvancedSwapDetails error', error)
      }
    })()
  }, [inputName, outputName, amountString])

  return (
    <AutoColumn gap="0.4rem">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          {showRoute && (
            <>
              <RowBetween style={{ padding: '0 16px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <TYPE.black className="text-detail" fontWeight={400} color={theme.text2}>
                    Route
                  </TYPE.black>
                  <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
                </span>
                <SwapRoute trade={trade} />
                <RouteAccordionStyled
                  className="text-detail"
                  onClick={() => setShowRouterDetail(!showRouterDetail)}
                  sx={{ marginLeft: '.5rem' }}
                >
                  {/* {'>'} */}
                  <img
                    src={arrowShowRoute}
                    alt=""
                    style={
                      showRouterDetail
                        ? { transform: 'rotate(180deg)', width: '12px', height: '12px', cursor: 'pointer' }
                        : { width: '12px', height: '12px', cursor: 'pointer' }
                    }
                  />
                </RouteAccordionStyled>
              </RowBetween>
              <RouteStyled className="text-detail" sx={showRouterDetail ? { maxHeight: 'unset' } : { display: 'none' }}>
                <img className="leftTokenImg" src={TeleRouteIcon} alt="" />
                <img className="LineVIcon" src={LineVIcon} alt="" />
                <div>
                  {
                    // @ts-ignore
                    routeData &&
                      routeData.hasOwnProperty('route') &&
                      routeData.route.map((item, index) => (
                        <RouteCellStyled key={index}>
                          {item.map((routeItem, routeItemIndex) => (
                            <>
                              <div className="routeCellBlock ColumnStartCenter" style={{ marginRight: '.5rem' }}>
                                {routeItemIndex == 0 ? <span>{routeData.percents[index]}%</span> : <span>　</span>}
                                <img className="ArrowHLoneLine" src={ArrowHLoneLine} alt="" />
                                <span
                                  style={{
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    padding: '.1rem .3rem'
                                  }}
                                >
                                  {routeItem.stable ? 'Stable' : 'Volatile'}
                                </span>
                              </div>
                              <div className="tokenImgWrap" style={{ marginRight: '.5rem' }}>
                                <img src={TeleRouteIcon} alt="" />
                                <img src={TeleRouteIcon} alt="" />
                              </div>
                            </>
                          ))}
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
