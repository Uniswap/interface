import React, { useContext } from 'react'
import { Text } from 'rebass/styled-components'
import { ExternalLink } from '../../theme'
import { RowBetween } from 'components/Row'
import TradePricePrediction from './TradePricePrediction'
import styled from 'styled-components'
import { ThemeContext } from 'styled-components'
import { utils } from 'ethers'

const TradeDetailShow = styled.div<{ show: boolean }>`
  margin-top: 0.5rem;
  display: ${({ show }) => (show ? 'block' : 'none')};
  z-index: ${({ show }) => (show ? 1 : -1)};
`

interface TradeDetailProps {
  prediction: IPredictionSchema
  hash: string
  from: string
  showMe: boolean
  gasPrice: string
}

export default function TradeDetail({ prediction, hash, from, showMe, gasPrice }: TradeDetailProps) {
  const { executionPrice, nextMidPrice, slippage } = prediction
  const theme = useContext(ThemeContext)

  return (
    <TradeDetailShow show={showMe}>
      <RowBetween align="center">
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          Trade Price
        </Text>
        <TradePricePrediction
          formattedPriceFrom={executionPrice.formattedPriceFrom}
          formattedPriceTo={executionPrice.formattedPriceTo}
          label={executionPrice.label}
          labelInverted={executionPrice.labelInverted}
        ></TradePricePrediction>
      </RowBetween>

      <RowBetween align="center">
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          Next Price
        </Text>
        <TradePricePrediction
          formattedPriceFrom={nextMidPrice.formattedPriceFrom}
          formattedPriceTo={nextMidPrice.formattedPriceTo}
          label={nextMidPrice.label}
          labelInverted={nextMidPrice.labelInverted}
        ></TradePricePrediction>
      </RowBetween>
      <RowBetween align="center" style={{ marginTop: '0.2rem' }}>
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          Gas Price
        </Text>
        <Text fontWeight={500} fontSize={14}>
          {utils.formatUnits(Number(gasPrice), 'gwei').slice(0, 6)} Gwei
        </Text>
      </RowBetween>
      <RowBetween align="center" style={{ marginTop: '0.3rem' }}>
        <Text fontWeight={500} fontSize={14} color={theme.text2}>
          Slippage Tolerance
        </Text>
        <Text fontWeight={500} fontSize={14}>
          {slippage} %
        </Text>
      </RowBetween>

      <RowBetween align="center" style={{ marginTop: '0.5rem' }}>
        <ExternalLink style={{ color: '#674acf' }} href={'https://etherscan.io/address/' + from}>
          {'Maker ' + from.slice(0, 5) + '...' + from.slice(36, 42)}{' '}
        </ExternalLink>
        <ExternalLink style={{ color: '#674acf' }} href={'https://etherscan.io/tx/' + hash}>
          {'Tx ...' + hash.slice(58, 65)}
        </ExternalLink>
      </RowBetween>
    </TradeDetailShow>
  )
}
