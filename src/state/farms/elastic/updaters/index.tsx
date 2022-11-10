import { CHAINS_SUPPORT_NEW_POOL_FARM_API } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

import useGetUserFarmingInfo from './useGetUserElasticFarmInfo'
import FarmUpdaterV1 from './v1'
import FarmUpdaterV2 from './v2'

export type CommonProps = {
  interval?: boolean
}

const FarmUpdater: React.FC<CommonProps> = ({ interval = true }) => {
  const { chainId } = useActiveWeb3React()

  useGetUserFarmingInfo(interval)

  if (!chainId) {
    return null
  }

  if (CHAINS_SUPPORT_NEW_POOL_FARM_API.includes(chainId)) {
    return <FarmUpdaterV2 interval={interval} />
  } else {
    return <FarmUpdaterV1 interval={interval} />
  }
}

export default FarmUpdater
