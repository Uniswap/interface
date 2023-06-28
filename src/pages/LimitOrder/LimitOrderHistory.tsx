import { useCelo } from '@celo/react-celo'
import { ChainId as UbeswapChainId } from '@ubeswap/sdk'
import { TabButton } from 'components/Button'
import LimitOrderHistoryBody from 'components/LimitOrderHistory/LimitOrderHistoryBody'
import LimitOrderHistoryItem from 'components/LimitOrderHistory/LimitOrderHistoryItem'
import { Wrapper } from 'components/swap/styleds'
import { useToken } from 'hooks/Tokens'
import { useOrderBookRewardDistributorContract } from 'hooks/useContract'
import React, { useState } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'

import { ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS } from '../../constants'
import { useLimitOrdersHistory } from './useOrderBroadcasted'

export const LimitOrderHistory: React.FC = () => {
  const { network } = useCelo()
  const chainId = network.chainId as unknown as UbeswapChainId
  const limitOrderHistory = useLimitOrdersHistory()

  const [openOrdersTabActive, setOpenOrdersTabActive] = useState<boolean>(true)

  const rewardDistributorContract = useOrderBookRewardDistributorContract(
    ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS[chainId]
  )
  const rewardCurrencyAddress = useSingleCallResult(rewardDistributorContract, 'rewardCurrency', []).result?.[0]
  const rewardCurrency = useToken(rewardCurrencyAddress)

  return (
    <LimitOrderHistoryBody>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <TabButton active={openOrdersTabActive} onClick={() => setOpenOrdersTabActive(true)}>
          Open ({limitOrderHistory.filter((limitOrderHist) => limitOrderHist.isOrderOpen).length})
        </TabButton>
        <TabButton active={!openOrdersTabActive} onClick={() => setOpenOrdersTabActive(false)}>
          Completed ({limitOrderHistory.filter((limitOrderHist) => !limitOrderHist.isOrderOpen).length})
        </TabButton>
      </div>

      <Wrapper id="limit-order-history">
        {limitOrderHistory
          .filter((limitOrderHist) => {
            if (openOrdersTabActive) {
              return limitOrderHist.isOrderOpen
            }
            return !limitOrderHist.isOrderOpen
          })
          .reverse()
          .map((limitOrderHist, idx, arr) => {
            return (
              <LimitOrderHistoryItem
                key={limitOrderHist.orderHash}
                item={limitOrderHist}
                rewardCurrency={rewardCurrency || undefined}
                lastDisplayItem={idx === arr.length - 1}
              />
            )
          })}
      </Wrapper>
    </LimitOrderHistoryBody>
  )
}
