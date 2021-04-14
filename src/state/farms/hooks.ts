import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import farms from 'constants/ropsten.farms'
import { AppState } from 'state'
import { Farm } from 'state/types'
import { getBulkPoolData } from 'state/pools/hooks'
import { setFarmsPublicData, setLoading, setError } from './actions'
import { useETHPrice } from 'state/application/hooks'

export const useFarms = (): Farm[] => {
  const farms = useSelector((state: AppState) => state.farms.data)
  return farms
}

export const fetchFarms = async (ethPrice?: string) => {
  const poolsList = farms.map(farm => farm.lpAddress.toLowerCase())

  const pools = await getBulkPoolData(poolsList as string[], ethPrice)

  return farms.map(farm => {
    const pool = pools.filter((pool: any) => pool.id === farm.lpAddress.toLowerCase())[0]

    return {
      ...farm,
      ...pool
    }
  })
}

export const useFarmsPublicData = () => {
  const dispatch = useDispatch()

  const ethPrice = useETHPrice()

  const farmsData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  useEffect(() => {
    async function checkForFarms() {
      try {
        dispatch(setLoading(true))
        const farms = await fetchFarms(ethPrice.currentPrice)
        dispatch(setFarmsPublicData({ farms }))
      } catch (error) {
        dispatch(setError(error))
      }

      dispatch(setLoading(false))
    }

    checkForFarms()
  }, [dispatch, ethPrice.currentPrice])

  return { loading, error, data: farmsData }
}
