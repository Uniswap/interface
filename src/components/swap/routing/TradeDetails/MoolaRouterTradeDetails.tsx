import React from 'react'

import { MoolaRouterTrade } from '../hooks/useTrade'
import { UbeswapTradeDetails } from './UbeswapTradeDetails'

interface Props {
  trade: MoolaRouterTrade
  allowedSlippage: number
}

export const MoolaRouterTradeDetails: React.FC<Props> = ({ trade, allowedSlippage }: Props) => {
  return (
    <>
      <UbeswapTradeDetails trade={trade} allowedSlippage={allowedSlippage} />
      {/* <RowBetween>
        <RowFixed>
          <TYPE.yellow fontSize={14} fontWeight={500}>
            Your trade is being routed through Moola.
          </TYPE.yellow>
          <QuestionHelper text="Many Ubeswap pools use mCUSD or mCEUR as collateral. Ubeswap allows you to easily swap cUSD or cEUR for mcUSD without having to worry about manually depositing or withdrawing tokens." />
        </RowFixed>
      </RowBetween> */}
    </>
  )
}
