import { CHAINS_SUPPORT_NEW_POOL_FARM_API } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { ElasticPoolDetail } from 'types/pool'

import useGetElasticPoolsV1 from './useGetElasticPoolsV1'
import useGetElasticPoolsV2 from './useGetElasticPoolsV2'

export type CommonReturn = {
  isLoading: boolean
  isError: boolean
  data?: {
    [address: string]: ElasticPoolDetail
  }
}

const useGetElasticPools = (poolAddresses: string[]): CommonReturn => {
  const { chainId } = useActiveWeb3React()

  const shouldRunV2 = CHAINS_SUPPORT_NEW_POOL_FARM_API.includes(chainId)
  const responseV1 = useGetElasticPoolsV1(poolAddresses, shouldRunV2)
  const responseV2 = useGetElasticPoolsV2()

  if (shouldRunV2) {
    return responseV2
  }

  return responseV1
}

export default useGetElasticPools
