import React from 'react'
import { Trade } from 'dxswap-sdk'
import { AutoColumn } from '../Column'
import { ClickableText } from '../../pages/Pool/styleds'
import { RowBetween, RowFixed } from '../Row'
import { getNameForSupportedPlatform } from '../../utils/platform'

export interface SwapPlatformSelectorProps {
  allPlatformTrades: (Trade | undefined)[] | undefined,
  selectedTrade: Trade
}

export function SwapPlatformSelector({ allPlatformTrades, selectedTrade }: SwapPlatformSelectorProps) {
  console.log("All trades", allPlatformTrades)

  const changeSelectedTrade = (idx: number) => {

  }

  return (
    <div style={{borderBottom: '1px solid #292643', paddingBottom: '20px', marginBottom: '20px'}}>
      <AutoColumn gap="8px">
        {allPlatformTrades?.map((trade, i) => {
          return (
            <RowBetween key={i}>
              <RowFixed>
                <ClickableText onClick={() => changeSelectedTrade(i)}>
                  {trade ? getNameForSupportedPlatform(trade.platform) : ''}
                </ClickableText>
              </RowFixed>
            </RowBetween>
          ) 
        })}
      </AutoColumn>
    </div>
  )
}
