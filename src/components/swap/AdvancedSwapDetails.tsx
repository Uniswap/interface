import { Trade } from '@ubeswap/sdk'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { ThemeContext } from 'styled-components'

import { useUserSlippageTolerance } from '../../state/user/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween } from '../Row'
import { UbeswapTrade } from './routing/trade'
import { TradeDetails } from './routing/TradeDetails'
import SwapRoute from './SwapRoute'

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  return (
    <>
      <AutoColumn style={{ padding: '0 16px' }}>
        <TradeDetails trade={trade} allowedSlippage={allowedSlippage} />
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: UbeswapTrade
}

const InfoLink = styled(ExternalLink)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.bg3};
  padding: 6px 6px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.text1};
`

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const [allowedSlippage] = useUserSlippageTolerance()

  const path = trade && trade.path
  const showRoute = Boolean(path && path.length > 2)
  const { t } = useTranslation()

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
                    {t('Route')}
                  </TYPE.black>
                  <QuestionHelper text={t('RoutingThroughTheseTokensResultedInTheBestPriceForYourTrade')} />
                </span>
                <SwapRoute trade={trade} />
              </RowBetween>
            </>
          )}
          {!trade.hidePairAnalytics && !showRoute && (
            <AutoColumn style={{ padding: '12px 16px 0 16px' }}>
              <InfoLink
                href={'https://info.ubeswap.org/pair/' + trade.route.pairs[0].liquidityToken.address}
                target="_blank"
              >
                {t('ViewPairAnalytics')} ↗
              </InfoLink>
            </AutoColumn>
          )}
        </>
      )}
    </AutoColumn>
  )
}
