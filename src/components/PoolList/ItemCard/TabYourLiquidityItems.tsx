import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import ItemCardInfoRow from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { t } from '@lingui/macro'
import { getMyLiquidity, parseSubgraphPoolData } from 'utils/dmm'
import { ONE_BIPS } from 'constants/index'
import React from 'react'
import { ChainId, ETHER, Percent } from '@dynamic-amm/sdk'
import { tryParseAmount } from 'state/swap/hooks'
import { useActiveWeb3React } from 'hooks'

export default function TabYourLiquidityItems({
  poolData,
  myLiquidity,
}: {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
}) {
  const { chainId } = useActiveWeb3React()

  const { currency0, currency1, reserve0, reserve1, totalSupply } = parseSubgraphPoolData(poolData, chainId as ChainId)

  const liquidityTokenBalance = myLiquidity?.liquidityTokenBalance
    ? tryParseAmount(myLiquidity?.liquidityTokenBalance, ETHER)
    : undefined

  const pooledToken0 =
    liquidityTokenBalance && reserve0 && totalSupply
      ? liquidityTokenBalance.multiply(reserve0).divide(totalSupply)
      : undefined

  const pooledToken1 =
    liquidityTokenBalance && reserve1 && totalSupply
      ? liquidityTokenBalance.multiply(reserve1).divide(totalSupply)
      : undefined

  const yourShareOfPool =
    liquidityTokenBalance && totalSupply ? new Percent(liquidityTokenBalance.raw, totalSupply.raw) : undefined
  return (
    <>
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
      <ItemCardInfoRow
        name={t`Total LP Tokens`}
        value={liquidityTokenBalance ? liquidityTokenBalance.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Pooled ${poolData.token0.symbol}`}
        currency={currency0}
        value={pooledToken0 ? pooledToken0.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Pooled ${poolData.token1.symbol}`}
        currency={currency1}
        value={pooledToken1 ? pooledToken1.toSignificant(6) : '-'}
      />
      <ItemCardInfoRow
        name={t`Your Share Of Pool`}
        value={
          yourShareOfPool
            ? yourShareOfPool.equalTo('0')
              ? '0%'
              : yourShareOfPool.lessThan(ONE_BIPS)
              ? '<0.01%'
              : `${yourShareOfPool.toFixed(2)}%`
            : '-'
        }
      />
    </>
  )
}
