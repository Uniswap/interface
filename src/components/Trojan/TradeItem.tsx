import React, { useContext, useState } from 'react'
import { Box, Text } from 'rebass/styled-components'
import { RowBetween } from 'components/Row'
import TradeDetail from './TradeDetail'
import { darken } from 'polished'
import styled from 'styled-components'
import { ThemeContext } from 'styled-components'
import { ClickableText } from 'pages/Trojan/styleds'
import TimeAgo from 'react-timeago'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { Token, TokenAmount } from '@uniswap/sdk'

const Proposal = styled(Box)`
  padding: 0.5rem;
  width: 100%;
  margin-top: 0.5rem;
  border-radius: 12px;
  align-items: center;
  text-align: left;
  outline: none;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg1};
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg1)};
  }
`
interface TradeItemProps {
  currency1: any
  tx: ITransaction
  initOpen: boolean
}

const Card = styled(Box)<{ width?: string; padding?: string; border?: string; borderRadius?: string }>`
  width: ${({ width }) => width ?? '100%'};
  border-radius: 12px;
  padding: 0.7rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.text3};
  background-color: ${({ theme }) => theme.bg1};
`

export default function TradeItem({ tx, currency1, initOpen }: TradeItemProps) {
  const { hash, prediction, from, contractCall, value } = tx
  const { fromToken, toToken, executionValues } = prediction
  const theme = useContext(ThemeContext)
  const [showMe, setShowMe] = useState(initOpen)

  const cf = new Token(fromToken.chainId, fromToken.address, fromToken.decimals, fromToken.name)
  const ct = new Token(toToken.chainId, toToken.address, toToken.decimals, toToken.name)

  const amountIn = contractCall.methodName === 'swapExactETHForTokens' ? value : contractCall.params.amountIn

  const caf = new TokenAmount(cf, amountIn)
  const cat = new TokenAmount(ct, contractCall.params.amountOutMin)

  return (
    <Proposal style={{ direction: 'ltr' }} key={hash}>
      <ClickableText fontSize={12} color={theme.text1} onClick={() => setShowMe(!showMe)}>
        <LightCard>
          <RowBetween>
            {currency1?.name === toToken.name ? (
              <>
                <Text fontSize={14} color={theme.green1}>
                  {'Buy ▲ '} {toToken.symbol + ' '}
                  <b> {<FormattedCurrencyAmount currencyAmount={cat} />} </b>
                </Text>
                <Text fontSize={14} color={theme.text1}>
                  {' For '} {fromToken.symbol + ' '}
                  <b>{<FormattedCurrencyAmount currencyAmount={caf} />}</b>
                </Text>
              </>
            ) : (
              <>
                <Text fontSize={14} color={theme.red3}>
                  {'Sell ▼ '} {fromToken.symbol + ' '}
                  <b> {<FormattedCurrencyAmount currencyAmount={caf} />} </b>
                </Text>
                <Text fontSize={14} color={theme.text1}>
                  {' For '} {toToken.symbol + ' '}
                  <b>{<FormattedCurrencyAmount currencyAmount={cat} />}</b>
                </Text>
              </>
            )}

            {
              <>
                <Text fontSize={14} color={currency1?.name === fromToken.name ? theme.red1 : theme.green1}>
                  {'Impact '}
                  {Number(executionValues.computedPriceImpact).toFixed(2) === '0.00'
                    ? '<0.01'
                    : Number(executionValues.computedPriceImpact).toFixed(2)}
                  {' %'}
                </Text>
              </>
            }
            {tx.timeStamp && <TimeAgo date={tx.timeStamp} />}
          </RowBetween>
        </LightCard>
      </ClickableText>
      <TradeDetail prediction={prediction} hash={hash} from={from} showMe={showMe} gasPrice={tx.gasPrice}></TradeDetail>
    </Proposal>
  )
}
