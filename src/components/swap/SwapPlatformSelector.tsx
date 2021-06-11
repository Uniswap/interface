import React, { useCallback } from 'react'
import { CurrencyAmount, RoutablePlatform, Trade, TradeType } from 'dxswap-sdk'
import { AutoColumn } from '../Column'
import { TYPE } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'
import { Box, Flex } from 'rebass'
import Radio from '../Radio'
import QuestionHelper from '../QuestionHelper'
import WarningHelper from '../WarningHelper'
import SwapRoute from './SwapRoute'
import { useSwapsGasEstimations } from '../../hooks/useSwapsGasEstimate'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { useSwapState } from '../../state/swap/hooks'
import { useGasFeesUSD } from '../../hooks/useGasFeesUSD'
import { RowFixed } from '../Row'
import { ROUTABLE_PLATFORM_LOGO } from '../../constants'
import styled from 'styled-components'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { Field } from '../../state/swap/actions'
import Skeleton from 'react-loading-skeleton'
import useDebounce from '../../hooks/useDebounce'

const TableHeaderText = styled.span`
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  color: ${props => props.theme.bg5};
`

const Spacer = styled.tr`
  height: 6px;
`

export interface SwapPlatformSelectorProps {
  allPlatformTrades: (Trade | undefined)[] | undefined
  selectedTrade?: Trade
  onSelectedPlatformChange: (newPlatform: RoutablePlatform) => void
}

interface GasFeeProps {
  loading: boolean
  gasFeeUSD: CurrencyAmount | null
}

function GasFee({ loading, gasFeeUSD }: GasFeeProps) {
  if (loading) {
    return <Skeleton width="36px" height="12px" />
  }
  if (gasFeeUSD) {
    return (
      <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
        ${gasFeeUSD.toFixed(2)}
      </TYPE.main>
    )
  }
  return <WarningHelper text="Could not estimate gas fee. Please make sure you've approved the traded token." />
}

export function SwapPlatformSelector({
  allPlatformTrades,
  selectedTrade,
  onSelectedPlatformChange
}: SwapPlatformSelectorProps) {
  const [allowedSlippage] = useUserSlippageTolerance()
  const { recipient } = useSwapState()
  const { loading: loadingTradesGasEstimates, estimations } = useSwapsGasEstimations(
    allowedSlippage,
    recipient,
    allPlatformTrades
  )
  const { loading: loadingGasFeesUSD, gasFeesUSD } = useGasFeesUSD(
    estimations.map(estimation => (estimation && estimation.length > 0 ? estimation[0] : null))
  )
  const loadingGasFees = loadingGasFeesUSD || loadingTradesGasEstimates
  const debouncedLoadingGasFees = useDebounce(loadingGasFees, 2000)

  const showGasFees = estimations.length === allPlatformTrades?.length

  const handleSelectedTradeOverride = useCallback(
    event => {
      const newTrade = allPlatformTrades?.find(trade => trade?.platform.name.toLowerCase() === event.target.value)
      if (!newTrade) return
      onSelectedPlatformChange(newTrade.platform)
    },
    [allPlatformTrades, onSelectedPlatformChange]
  )

  return (
    <AutoColumn gap="18px" style={{ borderBottom: '1px solid #292643', paddingBottom: '12px', marginBottom: '12px' }}>
      <table style={{ width: '100%', margin: 0, padding: 0 }}>
        <thead>
          <tr>
            <td colSpan={4}>
              <TableHeaderText>EXCHANGE</TableHeaderText>
            </td>
            <td>
              <TableHeaderText>FEE</TableHeaderText>
            </td>
            {showGasFees && (
              <td align="right">
                <TableHeaderText>GAS</TableHeaderText>
              </td>
            )}
            <td align="right">
              <TableHeaderText>MIN. RECEIVED</TableHeaderText>
            </td>
          </tr>
        </thead>
        <tbody>
          <Spacer />
          {allPlatformTrades?.map((trade, i) => {
            if (!trade) return null // some platforms might not be compatible with the currently selected network
            const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
            const gasFeeUSD = gasFeesUSD[i]
            const { realizedLPFee } = computeTradePriceBreakdown(trade)
            const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)
            return (
              <tr key={i} style={{ lineHeight: '22px' }}>
                <td colSpan={4}>
                  <Radio
                    checked={selectedTrade?.platform.name === trade.platform.name}
                    label={trade.platform.name}
                    icon={ROUTABLE_PLATFORM_LOGO[trade.platform.name]}
                    value={trade.platform.name.toLowerCase()}
                    onChange={handleSelectedTradeOverride}
                  />
                </td>
                <td>
                  <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
                    {realizedLPFee ? `${realizedLPFee.toFixed(2)}%` : '-'}
                  </TYPE.main>
                </td>
                {showGasFees && (
                  <td width="44px" align="right">
                    <GasFee loading={debouncedLoadingGasFees} gasFeeUSD={gasFeeUSD} />
                  </td>
                )}
                <td align="right">
                  <RowFixed>
                    <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
                      {isExactIn
                        ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)}` ?? '-'
                        : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)}` ?? '-'}
                    </TYPE.subHeader>
                    <CurrencyLogo
                      currency={isExactIn ? trade.outputAmount.currency : trade.inputAmount.currency}
                      size="14px"
                      marginLeft={4}
                    />
                  </RowFixed>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {selectedTrade && selectedTrade.route.path.length > 2 && (
        <Flex mx="2px" width="100%">
          <Flex>
            <Box>
              <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500" minWidth="auto">
                Route
              </TYPE.body>
            </Box>
            <Box>
              <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
            </Box>
          </Flex>
          <Box flex="1">
            <SwapRoute trade={selectedTrade} />
          </Box>
        </Flex>
      )}
    </AutoColumn>
  )
}
