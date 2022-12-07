import { Fraction } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { Navigate } from 'react-router-dom'

import ItemCardInfoRow, { ItemCardInfoRowPriceRange } from 'components/PoolList/ItemCard/ItemCardInfoRow'
import DMM_POOL_INTERFACE from 'constants/abis/dmmPool'
import { AMP_LIQUIDITY_HINT, ONLY_STATIC_FEE_CHAINS, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { SubgraphPoolData } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { feeRangeCalc } from 'utils/dmm'

export default function TabDetailsItems({ poolData }: { poolData: SubgraphPoolData }) {
  const { chainId, isEVM, networkInfo } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  const factories = useMultipleContractSingleData([poolData.id], DMM_POOL_INTERFACE, 'factory')
  if (!isEVM) return <Navigate to="/" />
  const isNewStaticFeePool = factories?.[0]?.result?.[0] === (networkInfo as EVMNetworkInfo).classic.static.factory

  return (
    <>
      <ItemCardInfoRow name={t`AMP Liquidity`} value={ampLiquidity as string} infoHelperText={AMP_LIQUIDITY_HINT} />
      <ItemCardInfoRowPriceRange poolData={poolData} />
      <ItemCardInfoRow
        infoHelperText={
          ONLY_STATIC_FEE_CHAINS[chainId]
            ? t`Liquidity providers will earn this trading fee for each trade that uses this pool`
            : undefined
        }
        name={poolData.fee ? t`Fee` : t`Fee Range`}
        value={
          poolData.fee
            ? factories?.[0]?.result !== undefined
              ? poolData.fee / (isNewStaticFeePool ? 1000 : 100) + '%'
              : ''
            : feeRangeCalc(+amp.toSignificant(5))
        }
      />
    </>
  )
}
