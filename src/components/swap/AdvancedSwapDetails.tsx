import { Trade, TradeType } from 'dxswap-sdk'
import React from 'react'
import { Settings } from 'react-feather'
import styled from 'styled-components'
import { Field } from '../../state/swap/actions'
import { useToggleSettingsMenu } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE, ExternalLink } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'

const InfoLink = styled(ExternalLink)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.purple3};
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 11px;
  line-height: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.purple3};
`

const StyledMenuIcon = styled(Settings)`
  height: 12px;
  width: 12px;
  margin-left: 3px;
  cursor: pointer;
`

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)
  const toggleSettings = useToggleSettingsMenu()
  // Formatting logic: allowedSlippage = 900 shows as 9%, 950 shows as 9.50%
  const formattedSlippage =
    (allowedSlippage / 100) % 1 !== 0 ? (allowedSlippage / 100).toFixed(2) : (allowedSlippage / 100).toFixed(0)
  const currency = isExactIn ? trade.outputAmount.currency : trade.inputAmount.currency

  return (
    <>
      <AutoColumn gap="8px">
        <RowBetween>
          <RowBetween mr="13px">
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              Max slippage
            </TYPE.body>
            <RowFixed>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
                {formattedSlippage}%
              </TYPE.body>
              <StyledMenuIcon onClick={toggleSettings} id="open-settings-from-swap-dialog-button"></StyledMenuIcon>
            </RowFixed>
          </RowBetween>
          <RowBetween ml="13px">
            <RowFixed>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
                {isExactIn ? 'Min received' : 'Max sold'}
              </TYPE.body>
              <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
            </RowFixed>
            <RowFixed>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500" color="white">
                {isExactIn
                  ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)}` ?? '-'
                  : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)}` ?? '-'}
              </TYPE.body>
              <CurrencyLogo currency={currency} size="14px" style={{ margin: '0 2px' }} />
            </RowFixed>
          </RowBetween>
        </RowBetween>
        <RowBetween>
          <RowBetween mr="13px">
            <RowFixed>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
                Price impact
              </TYPE.body>
              <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
            </RowFixed>
            <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
          </RowBetween>
          <RowBetween ml="13px">
            <RowFixed>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
                Fees
              </TYPE.body>
              <QuestionHelper text="A portion of each trade goes to liquidity providers as incentive." />
            </RowFixed>
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              {realizedLPFee ? `${realizedLPFee.toSignificant(2)}%` : '-'}
            </TYPE.body>
          </RowBetween>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  return (
    <AutoColumn gap="8px">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          <AutoColumn style={{ marginTop: '8px' }}>
            <InfoLink
              href={'https://dxstats.eth.link/#/pair/' + trade.route.pairs[0].liquidityToken.address}
              target="_blank"
            >
              View pair analytics ↗
            </InfoLink>
          </AutoColumn>
        </>
      )}
    </AutoColumn>
  )
}
