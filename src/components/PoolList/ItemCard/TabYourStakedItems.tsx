import { SubgraphPoolData } from 'state/pools/hooks'
import ItemCardInfoRow from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { t } from '@lingui/macro'
import React from 'react'
import { useUserStakedBalance } from 'state/farms/hooks'
import { ChainId } from '@dynamic-amm/sdk'
import { parseSubgraphPoolData } from 'utils/dmm'
import { useActiveWeb3React } from 'hooks'
import { formattedNum } from 'utils'

export default function TabYourStakedItems({ poolData }: { poolData: SubgraphPoolData }) {
  const { chainId } = useActiveWeb3React()

  const { currency0, currency1 } = parseSubgraphPoolData(poolData, chainId as ChainId)

  const {
    userStakedToken0Balance,
    userStakedToken1Balance,
    userStakedBalance,
    userStakedBalanceUSD,
  } = useUserStakedBalance(poolData)

  return (
    <>
      <ItemCardInfoRow
        name={t`Your Staked Balance`}
        value={formattedNum(userStakedBalanceUSD.toSignificant(18), true)}
      />
      <ItemCardInfoRow name={t`Staked LP Tokens`} value={userStakedBalance.toSignificant(3)} />
      <ItemCardInfoRow
        name={t`Staked ${poolData.token0.symbol}`}
        value={userStakedToken0Balance.toSignificant(3)}
        currency={currency0}
      />
      <ItemCardInfoRow
        name={t`Staked ${poolData.token1.symbol}`}
        value={userStakedToken1Balance.toSignificant(3)}
        currency={currency1}
      />
    </>
  )
}
