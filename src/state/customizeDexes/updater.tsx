import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { kyberswapDexes } from 'constants/dexes'
import { ELASTIC_NOT_SUPPORTED } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useLiquiditySources from 'hooks/useAggregatorStats'
import { AppDispatch } from 'state/index'

import { updateAllDexes } from '.'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

  const { chainId, isEVM } = useActiveWeb3React()
  const { data: dexes } = useLiquiditySources(chainId)

  // filterout kyberswap dexes, will hardcode
  const normalizeDexes = useMemo(() => {
    const temp =
      dexes?.map(item => ({ ...item, id: item.dexId })).filter(item => !item.dexId.includes('kyberswap')) || []
    const isSupportKSElastic = !ELASTIC_NOT_SUPPORTED[chainId]
    return [
      ...temp,
      ...(isEVM ? kyberswapDexes.filter(item => (isSupportKSElastic ? true : item.id !== 'kyberswapv2')) : []),
    ]
  }, [dexes, chainId, isEVM])

  useEffect(() => {
    if (chainId && normalizeDexes.length) {
      dispatch(
        updateAllDexes({
          chainId,
          dexes: normalizeDexes,
        }),
      )
    }
  }, [normalizeDexes, chainId, dispatch])

  return null
}
