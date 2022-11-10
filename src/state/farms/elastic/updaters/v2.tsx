import { CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool } from '@kyberswap/ks-sdk-elastic'
import { useEffect } from 'react'
import useSWR from 'swr'

import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { nativeOnChain } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAppDispatch } from 'state/hooks'
import { ElasticPool, RawToken } from 'state/prommPools/useGetElasticPools/useGetElasticPoolsV2'
import { isAddressString } from 'utils'

import { CommonProps } from '.'
import { setFarms, setLoading } from '..'
import { ElasticFarm } from '../types'

interface FarmingPool {
  id: string
  pid: string
  startTime: string
  endTime: string
  feeTarget: string
  vestingDuration: string
  farm: {
    id: string // address of fair launch contract
    rewardLocker: string
  }
  rewardTokensIds: string[]
  totalRewardAmounts: string[]
  pool: ElasticPool
  rewardTokens: RawToken[]
  stakedTvl: string
  apr: string
}

interface Response {
  code: number
  message: string
  data: {
    farmPools: FarmingPool[]
  }
}

const useGetElasticFarms = () => {
  const { chainId } = useActiveWeb3React()
  const chainRoute = chainId ? NETWORKS_INFO[chainId].internalRoute : ''

  // TODO: `chainRoute` may not be correct, update this when BE is available in other chains
  return useSWR<Response>(
    `${process.env.REACT_APP_POOL_FARM_BASE_URL}/${chainRoute}/api/v1/elastic/farm-pools?page=1&perPage=10000`,
    (url: string) => fetch(url).then(resp => resp.json()),
    {
      refreshInterval: 15_000,
    },
  )
}

const FarmUpdaterV2: React.FC<CommonProps> = ({ interval }) => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const { data, error, isValidating } = useGetElasticFarms()
  const farms = data?.data?.farmPools

  useEffect(() => {
    if (isValidating) {
      console.time('getFarmFromBackend')
      dispatch(setLoading({ chainId, loading: true }))
    } else {
      console.timeEnd('getFarmFromBackend')
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [chainId, dispatch, isValidating])

  useEffect(() => {
    if (error && chainId) {
      dispatch(setFarms({ chainId, farms: [] }))
      dispatch(setLoading({ chainId, loading: false }))
    }
  }, [error, dispatch, chainId])

  useEffect(() => {
    if (farms && chainId) {
      const poolsByFairLaunchContract: Record<
        string,
        {
          id: string
          rewardLocker: string
          pools: FarmingPool[]
        }
      > = {}
      farms.forEach(farmingPool => {
        const fairLaunchAddr = farmingPool.farm.id
        if (!poolsByFairLaunchContract[fairLaunchAddr]) {
          poolsByFairLaunchContract[fairLaunchAddr] = {
            id: fairLaunchAddr,
            rewardLocker: farmingPool.farm.rewardLocker,
            pools: [],
          }
        }

        poolsByFairLaunchContract[fairLaunchAddr].pools.push(farmingPool)
      })

      const formattedPoolData: ElasticFarm[] = Object.values(poolsByFairLaunchContract).map(
        ({ id, rewardLocker, pools: rawPools }) => {
          const pools = rawPools.map(rawPool => {
            const token0Address = isAddressString(rawPool.pool.token0.id)
            const token1Address = isAddressString(rawPool.pool.token1.id)

            const token0 =
              token0Address === WETH[chainId].address
                ? nativeOnChain(chainId)
                : new Token(
                    chainId,
                    token0Address,
                    Number(rawPool.pool.token0.decimals),
                    rawPool.pool.token0.symbol.toLowerCase() === 'mimatic' ? 'MAI' : rawPool.pool.token0.symbol,
                    rawPool.pool.token0.name,
                  )

            const token1 =
              token1Address === WETH[chainId].address
                ? nativeOnChain(chainId)
                : new Token(
                    chainId,
                    token1Address,
                    Number(rawPool.pool.token1.decimals),
                    rawPool.pool.token1.symbol.toLowerCase() === 'mimatic' ? 'MAI' : rawPool.pool.token1.symbol,
                    rawPool.pool.token1.name,
                  )

            const p = new Pool(
              token0.wrapped,
              token1.wrapped,
              Number(rawPool.pool.feeTier) as FeeAmount,
              rawPool.pool.sqrtPrice,
              rawPool.pool.liquidity,
              rawPool.pool.reinvestL,
              Number(rawPool.pool.tick),
            )

            const tvlToken0 = TokenAmount.fromRawAmount(token0.wrapped, 0)
            const tvlToken1 = TokenAmount.fromRawAmount(token1.wrapped, 0)

            return {
              startTime: Number(rawPool.startTime),
              endTime: Number(rawPool.endTime),
              pid: rawPool.pid,
              id: rawPool.id,
              feeTarget: rawPool.feeTarget,
              vestingDuration: Number(rawPool.vestingDuration),
              token0,
              token1,
              poolAddress: rawPool.pool.id,
              feesUSD: Number(rawPool.pool.feesUsd),
              pool: p,
              poolTvl: Number(rawPool.pool.totalValueLockedUsd),
              rewardTokens: rawPool.rewardTokens.map(token => {
                return token.id === ZERO_ADDRESS
                  ? nativeOnChain(chainId)
                  : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
              }),
              totalRewards: rawPool.rewardTokens.map((token, i) => {
                const rewardAmount = rawPool.totalRewardAmounts[i]
                const t =
                  token.id === ZERO_ADDRESS
                    ? nativeOnChain(chainId)
                    : new Token(chainId, token.id, Number(token.decimals), token.symbol, token.name)
                return CurrencyAmount.fromRawAmount(t, rewardAmount)
              }),
              tvlToken0,
              tvlToken1,
              apr: Number(rawPool.apr),
              poolAPR: Number(rawPool.pool.apr),
              stakedTvl: Number(rawPool.stakedTvl),
            }
          })

          // sort by pid
          // keep the same logic from v1
          pools.sort((pool1, pool2) => {
            if (pool1.pid === pool2.pid) {
              return 0
            }
            return pool1.pid < pool2.pid ? 1 : -1
          })

          return {
            id,
            rewardLocker,
            pools,
          }
        },
      )

      dispatch(setFarms({ chainId, farms: formattedPoolData }))
    }
  }, [chainId, dispatch, farms])

  return null
}

export default FarmUpdaterV2
