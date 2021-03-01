import React, { ReactNode, useCallback } from 'react'
import { RoutablePlatform, Trade } from 'dxswap-sdk'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'
import { Box, Flex } from 'rebass'
import Radio from '../Radio'
import QuestionHelper from '../QuestionHelper'
import SwapRoute from './SwapRoute'
import UniswapLogo from '../../assets/svg/uniswap-logo.svg'
import SwaprLogo from '../../assets/svg/logo.svg'
import SushiswapLogo from '../../assets/svg/sushiswap-logo.svg'
import HoneyswapLogo from '../../assets/svg/honeyswap-logo.svg'

const ROUTABLE_PLATFORM_LOGO: { [routablePaltformName: string]: ReactNode } = {
  [RoutablePlatform.UNISWAP.name]: <img width={16} height={16} src={UniswapLogo} alt="uniswap" />,
  [RoutablePlatform.SUSHISWAP.name]: <img width={16} height={16} src={SushiswapLogo} alt="sushiswap" />,
  [RoutablePlatform.SWAPR.name]: <img width={16} height={16} src={SwaprLogo} alt="swapr" />,
  [RoutablePlatform.HONEYSWAP.name]: <img width={16} height={16} src={HoneyswapLogo} alt="honeyswap" />
}

export interface SwapPlatformSelectorProps {
  allPlatformTrades: (Trade | undefined)[] | undefined
  selectedTrade?: Trade
  onSelectedPlatformChange: (newPlatform: RoutablePlatform) => void
}

export function SwapPlatformSelector({
  allPlatformTrades,
  selectedTrade,
  onSelectedPlatformChange
}: SwapPlatformSelectorProps) {
  const handleSelectedTradeOverride = useCallback(
    event => {
      const newTrade = allPlatformTrades?.find(trade => trade?.platform.name.toLowerCase() === event.target.value)
      if (!newTrade) return
      onSelectedPlatformChange(newTrade.platform)
    },
    [allPlatformTrades, onSelectedPlatformChange]
  )

  return (
    <AutoColumn gap="18px" style={{ borderBottom: '1px solid #292643', paddingBottom: '18px', marginBottom: '18px' }}>
      <AutoColumn gap="8px">
        {allPlatformTrades?.map((trade, i) => {
          if (!trade) return null // some platforms might not be compatible with the currently selected network
          return (
            <RowBetween key={i}>
              <Radio
                checked={selectedTrade?.platform.name === trade.platform.name}
                label={trade.platform.name}
                icon={ROUTABLE_PLATFORM_LOGO[trade.platform.name]}
                value={trade.platform.name.toLowerCase()}
                onChange={handleSelectedTradeOverride}
              />
              <Flex>
                <Box>
                  <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
                    {trade.outputAmount.toFixed(4)}
                  </TYPE.subHeader>
                </Box>
                <Box>
                  <CurrencyLogo currency={trade.outputAmount.currency} size="14px" style={{ margin: '0 2px' }} />
                </Box>
              </Flex>
            </RowBetween>
          )
        })}
      </AutoColumn>
      {selectedTrade && selectedTrade.route.path.length > 2 && (
        <RowFixed mx="2px">
          <TYPE.body mr="2px" fontSize="12px" lineHeight="15px" fontWeight="500">
            Route
          </TYPE.body>
          <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
          <SwapRoute trade={selectedTrade} />
        </RowFixed>
      )}
    </AutoColumn>
  )
}
