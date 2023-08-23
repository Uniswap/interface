import { Contract } from '@ethersproject/contracts'
import { formatUnits } from '@ethersproject/units'
import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import FARMING_CENTER_ABI from 'abis/farming-center.json'
import FINITE_FARMING_ABI from 'abis/finite-farming.json'
import NON_FUN_POS_MAN from 'abis/non-fun-pos-man.json'
import VIRTUAL_POOL_ABI from 'abis/virtual-pool.json'
import { FINITE_FARMING, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/addresses'
import { Aprs, Deposit, FormattedEternalFarming, FormattedRewardInterface, Position } from 'models/interface/farming'
import { PoolChartSubgraph } from 'models/interface/responseSubgraph'
import { useState } from 'react'
import { getContract } from 'utils'
import { getV3TokenFromAddress } from 'utils/farmUtils'

// import { useSelectedTokenList } from 'state/lists/v3/hooks'
// import { getContract, getV3TokenFromAddress } from 'utils'
// import { fetchEternalFarmAPR, fetchEternalFarmTVL, fetchPoolsAPR } from 'utils/api'
// import { formatTokenSymbol } from 'utils/v3-graph'
// import { FARMING_CENTER, FINITE_FARMING, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '../constants/v3/addresses'
import { useDefaultActiveTokens } from './Tokens'

export function useFarmingSubgraph() {
  const { chainId, account, provider } = useWeb3React()
  const tokenMap = useDefaultActiveTokens()

  const [positionsForPool, setPositionsForPool] = useState<Position[] | null>(null)
  const [positionsForPoolLoading, setPositionsForPoolLoading] = useState<boolean>(false)

  const [transferredPositions, setTransferredPositions] = useState<Deposit[] | null>(null)
  const [transferredPositionsLoading, setTransferredPositionsLoading] = useState<boolean>(false)

  const [rewardsResult, setRewardsResult] = useState<FormattedRewardInterface[]>([])
  const [rewardsLoading, setRewardsLoading] = useState<boolean>(false)

  const [positionsOnFarmer, setPositionsOnFarmer] = useState<{
    transferredPositionsIds: string[]
    oldTransferredPositionsIds: string[]
  } | null>(null)
  const [positionsOnFarmerLoading, setPositionsOnFarmerLoading] = useState<boolean>(false)

  const [eternalFarms, setEternalFarms] = useState<FormattedEternalFarming[] | null>(null)
  const [eternalFarmsLoading, setEternalFarmsLoading] = useState<boolean>(false)

  const [eternalFarmPoolAprs, setEternalFarmPoolAprs] = useState<Aprs | undefined>()
  const [eternalFarmPoolAprsLoading, setEternalFarmPoolAprsLoading] = useState<boolean>(false)

  const [eternalFarmAprs, setEternalFarmAprs] = useState<Aprs | undefined>()
  const [eternalFarmAprsLoading, setEternalFarmAprsLoading] = useState<boolean>(false)

  const [eternalFarmTvls, setEternalFarmTvls] = useState<any>()
  const [eternalFarmTvlsLoading, setEternalFarmTvlsLoading] = useState<boolean>(false)

  async function fetchToken(tokenId: string, farming = false) {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/token-details/${tokenId}?chainId=${chainId}&farming=${farming}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch token`)
      }
      const data = await res.json()
      return data && data.data && data.data.token ? data.data.token : undefined
    } catch (err) {
      throw new Error('Token fetching ' + err.message)
    }
  }

  async function fetchPool(poolId: string) {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/pool-details/${poolId}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch pool`)
      }
      const data = await res.json()

      const pool = data && data.data && data.data.pool ? data.data.pool : undefined

      if (!pool) return

      return {
        ...pool,
        token0: {
          ...pool.token0,
          symbol: pool.token0.symbol,
        },
        token1: {
          ...pool.token1,
          symbol: pool.token1.symbol,
        },
      }
    } catch (err) {
      throw new Error('Pool fetching ' + err.message)
    }
  }

  async function fetchLimit(limitFarmingId: string) {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/limit-farming/${limitFarmingId}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch limit farm`)
      }
      const data = await res.json()
      return data && data.data && data.data.limitFarm ? data.data.limitFarm : undefined
    } catch (err) {
      throw new Error('Limitfarming fetching ' + err.message)
    }
  }

  async function fetchEternalFarming(farmId: string) {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/eternal-farming/${farmId}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch eternal farm`)
      }
      const data = await res.json()
      return data && data.data && data.data.eternalFarm ? data.data.eternalFarm : undefined
    } catch (err) {
      throw new Error('Eternalfarming fetching ' + err.message)
    }
  }

  async function fetchRewards() {
    if (!account || !chainId) return

    try {
      setRewardsLoading(true)

      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/farm-rewards/${account}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch eternal farm`)
      }
      const data = await res.json()
      const rewards = data && data.data && data.data.rewards ? data.data.rewards : []

      if (!provider) throw new Error('No provider')

      const newRewards: any[] = []

      for (const reward of rewards) {
        const rewardToken = await fetchToken(reward.rewardAddress, true)

        const rewardAmount =
          +reward.amount > 0
            ? (+reward.amount / Math.pow(10, rewardToken ? +rewardToken.decimals : 0)).toFixed(
                rewardToken ? +rewardToken.decimals : 0
              )
            : 0

        const newReward = {
          ...reward,
          amount: rewardAmount,
          trueAmount: +reward.amount,
          symbol: rewardToken?.symbol,
          name: rewardToken?.name,
        }

        newRewards.push(newReward)
      }

      setRewardsResult(newRewards)
    } catch (err) {
      // setRewardsResult(null);
      if (err instanceof Error) {
        throw new Error('Reward fetching ' + err.message)
      }
    }

    setRewardsLoading(false)
  }

  async function fetchTransferredPositions() {
    if (!chainId || !account) {
      setTransferredPositions([])
      return
    }

    if (!provider) throw new Error('No provider')

    try {
      setTransferredPositionsLoading(true)

      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/transferred-positions/${account}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch transferred positions`)
      }
      const data = await res.json()
      const positionsTransferred = data && data.data && data.data.positions ? data.data.positions : []

      if (positionsTransferred.length === 0) {
        setTransferredPositions([])
        setTransferredPositionsLoading(false)
        return
      }

      const _positions: any[] = []

      for (const position of positionsTransferred) {
        const nftContract = new Contract(
          NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
          NON_FUN_POS_MAN,
          provider.getSigner()
        )

        const { tickLower, tickUpper, liquidity, token0, token1 } = await nftContract.positions(+position.id)

        let _position = {
          ...position,
          tickLower,
          tickUpper,
          liquidity,
          token0,
          token1,
        }

        if (!position.limitFarming && !position.eternalFarming && typeof position.pool === 'string') {
          const _pool = await fetchPool(position.pool)
          if (_pool) {
            const token0 = getV3TokenFromAddress(_pool.token0.id, chainId, tokenMap)
            const token1 = getV3TokenFromAddress(_pool.token1.id, chainId, tokenMap)
            const newPool = {
              ..._pool,
              token0: token0 ? token0.token : _pool.token0,
              token1: token1 ? token1.token : _pool.token1,
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            _position = { ..._position, pool: newPool }
          }
        }

        if (position.limitFarming) {
          const finiteFarmingContract = new Contract(FINITE_FARMING[chainId], FINITE_FARMING_ABI, provider.getSigner())

          const {
            rewardToken,
            bonusRewardToken,
            pool,
            startTime,
            endTime,
            createdAtTimestamp,
            multiplierToken,
            tokenAmountForTier1,
            tokenAmountForTier2,
            tokenAmountForTier3,
            tier1Multiplier,
            tier2Multiplier,
            tier3Multiplier,
          } = await fetchLimit(position.limitFarming)

          const rewardInfo = await finiteFarmingContract.callStatic.getRewardInfo(
            [rewardToken, bonusRewardToken, pool, +startTime, +endTime],
            +position.id
          )

          const _rewardToken = await fetchToken(rewardToken)
          const _bonusRewardToken = await fetchToken(bonusRewardToken)
          const _multiplierToken = await fetchToken(multiplierToken, true)
          const _pool = await fetchPool(pool)

          const token0 = getV3TokenFromAddress(_pool.token0.id, chainId, tokenMap)
          const token1 = getV3TokenFromAddress(_pool.token1.id, chainId, tokenMap)
          const newPool = {
            ..._pool,
            token0: token0 ? token0.token : _pool.token0,
            token1: token1 ? token1.token : _pool.token1,
          }

          _position = {
            ..._position,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            pool: newPool,
            limitRewardToken: _rewardToken,
            limitBonusRewardToken: _bonusRewardToken,
            limitStartTime: +startTime,
            limitEndTime: +endTime,
            started: +startTime * 1000 < Date.now(),
            ended: +endTime * 1000 < Date.now(),
            createdAtTimestamp: +createdAtTimestamp,
            limitEarned: rewardInfo[0] ? formatUnits(rewardInfo[0], _rewardToken.decimals) : 0,
            limitBonusEarned: rewardInfo[1] ? formatUnits(rewardInfo[1], _bonusRewardToken.decimals) : 0,
            multiplierToken: _multiplierToken,
            tokenAmountForTier1,
            tokenAmountForTier2,
            tokenAmountForTier3,
            tier1Multiplier,
            tier2Multiplier,
            tier3Multiplier,
          }
        } else {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/limit-farms-pool/${position.pool}?chainId=${chainId}`
          )
          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || res.statusText || `Failed to fetch limit farms`)
          }
          const data = await res.json()
          const limitFarmings = data && data.data && data.data.limitFarms ? data.data.limitFarms : []

          if (limitFarmings.filter((farm: any) => Math.round(Date.now() / 1000) < farm.startTime).length !== 0) {
            _position = {
              ..._position,
              limitAvailable: true,
            }
          }
        }

        if (position.eternalFarming) {
          const {
            id,
            rewardToken,
            bonusRewardToken,
            pool,
            startTime,
            endTime,
            multiplierToken,
            tier1Multiplier,
            tier2Multiplier,
            tier3Multiplier,
            tokenAmountForTier1,
            tokenAmountForTier2,
            tokenAmountForTier3,
            isDetached,
          } = await fetchEternalFarming(position.eternalFarming)

          const farmingCenterContract = new Contract(FARMING_CENTER[chainId], FARMING_CENTER_ABI, provider.getSigner())

          const _rewardToken = await fetchToken(rewardToken, true)
          const _bonusRewardToken = await fetchToken(bonusRewardToken, true)
          const _pool = await fetchPool(pool)

          const token0 = getV3TokenFromAddress(_pool.token0.id, chainId, tokenMap)
          const token1 = getV3TokenFromAddress(_pool.token1.id, chainId, tokenMap)
          const newPool = {
            ..._pool,
            token0: token0 ? token0.token : _pool.token0,
            token1: token1 ? token1.token : _pool.token1,
          }
          const _multiplierToken = await fetchToken(multiplierToken, true)

          let rewardRes: any
          try {
            rewardRes = await farmingCenterContract.callStatic.collectRewards(
              [rewardToken, bonusRewardToken, pool, startTime, endTime],
              +position.id,
              { from: account }
            )
            // eslint-disable-next-line no-empty
          } catch (e) {}

          _position = {
            ..._position,
            farmId: id,
            eternalRewardToken: _rewardToken,
            eternalBonusRewardToken: _bonusRewardToken,
            eternalStartTime: startTime,
            eternalEndTime: endTime,
            multiplierToken: _multiplierToken,
            tier1Multiplier,
            tier2Multiplier,
            tier3Multiplier,
            tokenAmountForTier1,
            tokenAmountForTier2,
            tokenAmountForTier3,
            isDetached,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            pool: newPool,
            eternalEarned: rewardRes ? formatUnits(rewardRes.reward, _rewardToken.decimals) : 0,
            eternalBonusEarned: rewardRes ? formatUnits(rewardRes.bonusReward, _bonusRewardToken.decimals) : 0,
          }
        } else {
          const res = await fetch(
            `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/eternal-farms-pool/${position.pool}?chainId=${chainId}`
          )
          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(errorText || res.statusText || `Failed to fetch eternal farms`)
          }
          const data = await res.json()
          const eternalFarmings = data && data.data && data.data.eternalFarms ? data.data.eternalFarms : []

          if (eternalFarmings.filter((farm: any) => +farm.rewardRate || +farm.bonusRewardRate).length !== 0) {
            _position = {
              ..._position,
              eternalAvailable: true,
            }
          }
        }

        _positions.push(_position)
      }
      setTransferredPositions(_positions)
    } catch (err) {
      throw new Error('Transferred positions ' + 'code: ' + err.code + ', ' + err.message)
    } finally {
      setTransferredPositionsLoading(false)
    }
  }

  async function fetchPositionsForPool(pool: PoolChartSubgraph, minRangeLength: string) {
    if (!chainId || !account) return

    try {
      setPositionsForPoolLoading(true)

      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/pool-positions/${account}?chainId=${chainId}&poolId=${pool.id}&minRangeLength=${minRangeLength}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch eternal farms`)
      }
      const data = await res.json()
      const positionsTransferred = data && data.data && data.data.positions ? data.data.positions : []

      const _positions: Position[] = []

      let _position: Position

      //Hack
      for (const position of positionsTransferred) {
        _position = { ...position, onFarmingCenter: position.onFarmingCenter }

        _positions.push(_position)
      }

      setPositionsForPool(_positions)
    } catch (err) {
      throw new Error('Positions for pools ' + err)
    } finally {
      setPositionsForPoolLoading(false)
    }
  }

  async function fetchPositionsOnFarmer(account: string) {
    try {
      setPositionsOnFarmerLoading(true)

      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/transferred-positions/${account}?chainId=${chainId}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch transferred positions`)
      }
      const data = await res.json()
      const positionsTransferred = data && data.data && data.data.positions ? data.data.positions : []

      if (positionsTransferred.length === 0) {
        setPositionsOnFarmer({
          transferredPositionsIds: [],
          oldTransferredPositionsIds: [],
        })
        setPositionsOnFarmerLoading(false)
        return
      }

      const transferredPositionsIds = positionsTransferred.map((position: any) => position.id)

      const oldTransferredPositionsIds: string[] = []

      setPositionsOnFarmer({
        transferredPositionsIds,
        oldTransferredPositionsIds,
      })
    } catch (err) {
      setPositionsOnFarmerLoading(false)
      throw new Error('Fetching positions on farmer ' + err)
    }
  }

  async function fetchEternalFarmPoolAprs() {
    if (!chainId) return
    setEternalFarmPoolAprsLoading(true)

    try {
      const aprs: Aprs = await fetchPoolsAPR(chainId)
      setEternalFarmPoolAprs(aprs)
    } catch (err) {
      if (err instanceof Error) {
        throw new Error('Error while fetching eternal farms pool Aprs' + err.message)
      }
    } finally {
      setEternalFarmPoolAprsLoading(false)
    }
  }

  async function fetchEternalFarmAprs() {
    if (!chainId) return
    setEternalFarmAprsLoading(true)

    try {
      const aprs: Aprs = await fetchEternalFarmAPR(chainId)
      setEternalFarmAprs(aprs)
    } catch (err) {
      if (err instanceof Error) {
        throw new Error('Error while fetching eternal farms Aprs' + err.message)
      }
    } finally {
      setEternalFarmAprsLoading(false)
    }
  }

  async function fetchEternalFarmTvls() {
    if (!chainId) return
    setEternalFarmTvlsLoading(true)

    try {
      const tvls = await fetchEternalFarmTVL(chainId)
      setEternalFarmTvls(tvls)
    } catch (err) {
      if (err instanceof Error) {
        throw new Error('Error while fetching eternal farms Tvls' + err.message)
      }
    } finally {
      setEternalFarmTvlsLoading(false)
    }
  }

  async function fetchEternalFarms() {
    setEternalFarmsLoading(true)
    if (!provider) throw new Error('No provider')
    try {
      const res = await fetch(`${process.env.REACT_APP_LEADERBOARD_APP_URL}/farming/eternal-farms?chainId=${chainId}`)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to fetch eternal farms`)
      }
      const data = await res.json()
      const eternalFarmings = data && data.data && data.data.farms ? data.data.farms : []

      if (eternalFarmings.length === 0) {
        setEternalFarms([])
        setEternalFarmsLoading(false)
        return
      }

      const _eternalFarmings: FormattedEternalFarming[] = []

      for (const farming of eternalFarmings) {
        try {
          const virtualPoolContract = getContract(farming.virtualPool, VIRTUAL_POOL_ABI, provider)
          const reward = await virtualPoolContract.rewardReserve0()
          const bonusReward = await virtualPoolContract.rewardReserve1()
          const pool = await fetchPool(farming.pool)
          const rewardToken = await fetchToken(farming.rewardToken, true)
          const bonusRewardToken = await fetchToken(farming.bonusRewardToken, true)
          const wrappedToken0 = getV3TokenFromAddress(pool.token0.id, chainId ?? ChainId.ROLLUX, tokenMap)
          const wrappedToken1 = getV3TokenFromAddress(pool.token1.id, chainId ?? ChainId.ROLLUX, tokenMap)
          const newPool = {
            ...pool,
            token0: wrappedToken0 ? wrappedToken0.token : pool.token0,
            token1: wrappedToken1 ? wrappedToken1.token : pool.token1,
          }
          const multiplierToken = await fetchToken(farming.multiplierToken, true)

          _eternalFarmings.push({
            ...farming,
            reward: reward.toString(),
            bonusReward: bonusReward.toString(),
            rewardToken,
            bonusRewardToken,
            multiplierToken,
            pool: newPool,
          })
        } catch (e) {
          console.log(e)
        }
      }

      setEternalFarms(_eternalFarmings)
    } catch (err) {
      setEternalFarms(null)
      if (err instanceof Error) {
        throw new Error('Error while fetching eternal farms ' + err.message)
      }
    } finally {
      setEternalFarmsLoading(false)
    }
  }

  return {
    fetchRewards: {
      rewardsResult,
      rewardsLoading,
      fetchRewardsFn: fetchRewards,
    },
    fetchPositionsForPool: {
      positionsForPool,
      positionsForPoolLoading,
      fetchPositionsForPoolFn: fetchPositionsForPool,
    },
    fetchTransferredPositions: {
      transferredPositions,
      transferredPositionsLoading,
      fetchTransferredPositionsFn: fetchTransferredPositions,
    },
    fetchPositionsOnFarmer: {
      positionsOnFarmer,
      positionsOnFarmerLoading,
      fetchPositionsOnFarmerFn: fetchPositionsOnFarmer,
    },
    fetchEternalFarms: {
      eternalFarms,
      eternalFarmsLoading,
      fetchEternalFarmsFn: fetchEternalFarms,
    },
    fetchEternalFarmPoolAprs: {
      eternalFarmPoolAprs,
      eternalFarmPoolAprsLoading,
      fetchEternalFarmPoolAprsFn: fetchEternalFarmPoolAprs,
    },
    fetchEternalFarmAprs: {
      eternalFarmAprs,
      eternalFarmAprsLoading,
      fetchEternalFarmAprsFn: fetchEternalFarmAprs,
    },
    fetchEternalFarmTvls: {
      eternalFarmTvls,
      eternalFarmTvlsLoading,
      fetchEternalFarmTvlsFn: fetchEternalFarmTvls,
    },
  }
}
