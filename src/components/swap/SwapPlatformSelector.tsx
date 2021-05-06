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
import { useGasFeesUSD } from '../../hooks/useGasFees'
import { RowFixed } from '../Row'
import { ROUTABLE_PLATFORM_LOGO } from '../../constants'
import { Dots } from '../../pages/Pools/styleds'

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
    return <Dots />
  }
  if (gasFeeUSD) {
    return (
      <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
        ${gasFeeUSD.toFixed(2)} GAS FEE
      </TYPE.main>
    )
  }
  return (
    <RowFixed>
      <TYPE.main color="yellow2" fontSize="10px" lineHeight="12px">
        N.A.
      </TYPE.main>
      <WarningHelper text="Could not estimate gas fee. Please make sure you've approved the traded token and that you have enough funds." />
    </RowFixed>
  )
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

  const handleSelectedTradeOverride = useCallback(
    event => {
      const newTrade = allPlatformTrades?.find(trade => trade?.platform.name.toLowerCase() === event.target.value)
      if (!newTrade) return
      onSelectedPlatformChange(newTrade.platform)
    },
    [allPlatformTrades, onSelectedPlatformChange]
  )

  const loadingGasFees = loadingGasFeesUSD || loadingTradesGasEstimates

  return (
    <AutoColumn gap="18px" style={{ borderBottom: '1px solid #292643', paddingBottom: '12px', marginBottom: '12px' }}>
      <table style={{ width: '100%', margin: 0, padding: 0 }}>
        <tbody>
          {allPlatformTrades?.map((trade, i) => {
            if (!trade) return null // some platforms might not be compatible with the currently selected network
            const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
            const gasFeeUSD = gasFeesUSD[i]
            return (
              <tr key={i} style={{ height: '20px', maxHeight: '20px', minHeight: '20px' }}>
                <td>
                  <Radio
                    checked={selectedTrade?.platform.name === trade.platform.name}
                    label={trade.platform.name}
                    icon={ROUTABLE_PLATFORM_LOGO[trade.platform.name]}
                    value={trade.platform.name.toLowerCase()}
                    onChange={handleSelectedTradeOverride}
                  />
                </td>
                <td align="right">
                  <GasFee loading={loadingGasFees} gasFeeUSD={gasFeeUSD} />
                </td>
                <td align="right">
                  <RowFixed>
                    <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
                      {isExactIn ? trade.outputAmount.toSignificant(4) : trade.inputAmount.toSignificant(4)}
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
