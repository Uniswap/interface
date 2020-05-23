import { Percent, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import { formatExecutionPrice } from '../../utils/prices'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { StyledBalanceMaxMini } from './styleds'

export default function SwapModalFooter({
  trade,
  showInverted,
  setShowInverted,
  severity,
  slippageAdjustedAmounts,
  onSwap,
  parsedAmounts,
  realizedLPFee,
  priceImpactWithoutFee,
  confirmText
}: {
  trade?: Trade
  showInverted: boolean
  setShowInverted: (inverted: boolean) => void
  severity: number
  slippageAdjustedAmounts?: { [field in Field]?: TokenAmount }
  onSwap: () => any
  parsedAmounts?: { [field in Field]?: TokenAmount }
  realizedLPFee?: TokenAmount
  priceImpactWithoutFee?: Percent
  confirmText: string
}) {
  const theme = useContext(ThemeContext)
  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <Text fontWeight={400} fontSize={14} color={theme.text2}>
            Price
          </Text>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text1}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px'
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              {trade?.tradeType === TradeType.EXACT_INPUT ? 'Min sent' : 'Maximum sold'}
            </TYPE.black>
            <QuestionHelper text="A boundary is set so you are protected from large price movements after you submit your trade." />
          </RowFixed>
          <RowFixed>
            <TYPE.black fontSize={14}>
              {trade?.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
            </TYPE.black>
            {parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.INPUT] && (
              <TYPE.black fontSize={14} marginLeft={'4px'}>
                {trade?.tradeType === TradeType.EXACT_INPUT
                  ? parsedAmounts[Field.OUTPUT]?.token?.symbol
                  : parsedAmounts[Field.INPUT]?.token?.symbol}
              </TYPE.black>
            )}
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
              Price Impact
            </TYPE.black>
            <QuestionHelper text="The difference between the market price and your price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
            <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TYPE.black fontSize={14}>
            {realizedLPFee ? realizedLPFee?.toSignificant(6) + ' ' + trade?.inputAmount?.token?.symbol : '-'}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>

      <AutoRow>
        <ButtonError onClick={onSwap} error={severity > 2} style={{ margin: '10px 0 0 0' }} id="confirm-swap-or-send">
          <Text fontSize={20} fontWeight={500}>
            {confirmText}
          </Text>
        </ButtonError>
      </AutoRow>
    </>
  )
}
