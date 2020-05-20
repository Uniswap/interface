import { Trade, TradeType } from '@uniswap/sdk'
import React, { useContext } from 'react'
import { ChevronUp, ChevronRight } from 'react-feather'
import { Text, Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { CursorPointer, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { SectionBreak } from './styleds'
import QuestionHelper from '../Question'
import { RowBetween, RowFixed } from '../Row'
import SlippageTabs, { SlippageTabsProps } from '../SlippageTabs'
import FormattedPriceImpact from './FormattedPriceImpact'
import TokenLogo from '../TokenLogo'

export interface AdvancedSwapDetailsProps extends SlippageTabsProps {
  trade: Trade
  onDismiss: () => void
}

export function AdvancedSwapDetails({ trade, onDismiss, ...slippageTabProps }: AdvancedSwapDetailsProps) {
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
  const theme = useContext(ThemeContext)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, slippageTabProps.rawSlippage)

  return (
    <AutoColumn gap="md">
      <CursorPointer>
        <RowBetween onClick={onDismiss} padding={'8px 20px'}>
          <Text fontSize={16} color={theme.text2} fontWeight={500} style={{ userSelect: 'none' }}>
            Hide Advanced
          </Text>
          <ChevronUp color={theme.text2} />
        </RowBetween>
      </CursorPointer>
      <SectionBreak />
      <AutoColumn style={{ padding: '0 20px' }}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              {isExactIn ? 'Minimum received' : 'Maximum sold'}
            </TYPE.black>
            <QuestionHelper
              text={
                isExactIn
                  ? 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will receive. A worse rate will cause your transaction to revert.'
                  : 'Price can change between when a transaction is submitted and when it is executed. This is the maximum amount you will pay. A worse rate will cause your transaction to revert.'
              }
            />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1} fontSize={14}>
              {isExactIn
                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.token.symbol}` ?? '-'
                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.token.symbol}` ?? '-'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Price Impact
            </TYPE.black>
            <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
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
          <TYPE.black fontSize={14} color={theme.text1}>
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.token.symbol}` : '-'}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>

      <SectionBreak />

      <RowFixed padding={'0 20px'}>
        <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
          Set slippage tolerance
        </TYPE.black>
        <QuestionHelper text="Your transaction will revert if the execution price changes by more than this amount after you submit your trade." />
      </RowFixed>
      <SlippageTabs {...slippageTabProps} />

      {trade.route.path.length > 2 && (
        <AutoColumn style={{ padding: '0 20px' }}>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Route
            </TYPE.black>
            <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
          </RowFixed>
          <Flex
            px="1rem"
            py="0.5rem"
            my="0.5rem"
            style={{ border: `1px solid ${theme.bg3}`, borderRadius: '1rem' }}
            flexWrap="wrap"
            width="100%"
            justifyContent="space-evenly"
            alignItems="center"
          >
            {trade.route.path
              // add a null in-between each item
              .flatMap((token, i, array) => {
                const lastItem = i === array.length - 1
                return lastItem ? [token] : [token, null]
              })
              .map((token, i) => {
                // use null as an indicator to insert chevrons
                if (token === null) {
                  return <ChevronRight key={i} color={theme.text2} />
                } else {
                  return (
                    <Flex my="0.5rem" alignItems="center" key={token.address} style={{ flexShrink: 0 }}>
                      <TokenLogo address={token.address} size="1.5rem" />
                      <TYPE.black fontSize={14} color={theme.text1} ml="0.5rem">
                        {token.symbol}
                      </TYPE.black>
                    </Flex>
                  )
                }
              })}
          </Flex>
        </AutoColumn>
      )}
    </AutoColumn>
  )
}
