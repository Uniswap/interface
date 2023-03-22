import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import { OUTSIDE_FAIRLAUNCH_ADDRESSES, ZERO_ADDRESS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useFairLaunchContracts } from 'hooks/useContract'
import { AppState } from 'state'
import { useETHPrice, useKyberSwapConfig } from 'state/application/hooks'
import { setFarmsData, setLoading, setYieldPoolsError } from 'state/farms/classic/actions'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { getBulkPoolDataFromPoolList } from 'state/pools/hooks'

export default function Updater({ isInterval = true }: { isInterval?: boolean }): null {
  const dispatch = useAppDispatch()
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const fairLaunchContracts = useFairLaunchContracts(false)
  const ethPrice = useETHPrice()
  const ethPriceRef = useRef(ethPrice.currentPrice)
  ethPriceRef.current = ethPrice.currentPrice
  const allTokens = useAllTokens()
  const { classicClient, blockClient } = useKyberSwapConfig()

  const farmsData = useSelector((state: AppState) => state.farms.data)

  const farmsDataRef = useRef(farmsData)
  farmsDataRef.current = farmsData

  // Fix slow network speed when loading farm.
  const latestChainId = useRef(chainId)
  latestChainId.current = chainId

  useEffect(() => {
    if (!isEVM) return
    console.count('running farm updater')
    let cancelled = false

    async function getListFarmsForContract(contract: Contract): Promise<Farm[]> {
      if (!isEVM) return []
      const rewardTokenAddresses: string[] = await contract?.getRewardTokens()
      if (cancelled) throw new Error('canceled')
      const poolLength = await contract?.poolLength()
      if (cancelled) throw new Error('canceled')

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const isV2 = (networkInfo as EVMNetworkInfo).classic.fairlaunchV2.includes(contract.address)
      const poolInfos = await Promise.all(
        pids.map(async (pid: number) => {
          const poolInfo = await contract?.getPoolInfo(pid)
          if (cancelled) throw new Error('canceled')
          if (isV2) {
            return {
              ...poolInfo,
              accRewardPerShares: poolInfo.accRewardPerShares.map((accRewardPerShare: BigNumber, index: number) =>
                accRewardPerShare.div(poolInfo.rewardMultipliers[index]),
              ),
              rewardPerSeconds: poolInfo.rewardPerSeconds.map((accRewardPerShare: BigNumber, index: number) =>
                accRewardPerShare.div(poolInfo.rewardMultipliers[index]),
              ),
              pid,
              fairLaunchVersion: FairLaunchVersion.V2,
            }
          }

          return {
            ...poolInfo,
            pid,
            fairLaunchVersion: FairLaunchVersion.V1,
          }
        }),
      )

      const stakedBalances = await Promise.all(
        pids.map(async (pid: number) => {
          const stakedBalance = account ? await contract?.getUserInfo(pid, account as string) : { amount: 0 }
          if (cancelled) throw new Error('canceled')

          return stakedBalance.amount
        }),
      )
      if (cancelled) throw new Error('canceled')

      const pendingRewards = await Promise.all(
        pids.map(async (pid: number) => {
          const pendingRewards = account ? await contract?.pendingRewards(pid, account as string) : null
          if (cancelled) throw new Error('canceled')

          return pendingRewards
        }),
      )
      if (cancelled) throw new Error('canceled')

      const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

      const farmsData = await getBulkPoolDataFromPoolList(
        poolAddresses,
        classicClient,
        blockClient,
        chainId,
        ethPriceRef.current,
      )
      if (cancelled) throw new Error('canceled')

      const rewardTokens = rewardTokenAddresses
        .map(address =>
          address.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? NativeCurrencies[chainId] : allTokens[address],
        )
        .filter(Boolean)

      const farms: Farm[] = poolInfos.map((poolInfo, index) => {
        return {
          ...farmsData.find(
            (farmData: Farm) => farmData && farmData.id.toLowerCase() === poolInfo.stakeToken.toLowerCase(),
          ),
          ...poolInfo,
          rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[index],
            rewards:
              poolInfo.fairLaunchVersion === FairLaunchVersion.V2
                ? pendingRewards[index] &&
                  pendingRewards[index].map((pendingReward: BigNumber, pendingRewardIndex: number) =>
                    pendingReward.div(poolInfo.rewardMultipliers[pendingRewardIndex]),
                  )
                : pendingRewards[index],
          },
        }
      })

      const outsideFarm = OUTSIDE_FAIRLAUNCH_ADDRESSES[contract.address]
      if (outsideFarm) {
        const poolData = await fetch(outsideFarm.subgraphAPI, {
          method: 'POST',
          body: JSON.stringify({
            query: outsideFarm.query,
          }),
        }).then(res => res.json())
        if (cancelled) throw new Error('canceled')

        // Defend data totalSupply from pancake greater than 18 decimals
        let totalSupply = poolData.data.pair.totalSupply

        const [a, b] = totalSupply.split('.')
        totalSupply = a + '.' + b.slice(0, 18)

        farms.push({
          ...poolData.data.pair,
          amp: 10000,
          vReserve0: poolData.data.pair.reserve0,
          vReserve1: poolData.data.pair.reserve1,
          token0: {
            ...poolData.data.pair.token0,
            derivedETH: poolData.data.pair.token0.derivedBNB,
          },

          token1: {
            ...poolData.data.pair.token1,
            derivedETH: poolData.data.pair.token1.derivedBNB,
          },
          trackedReserveETH: poolData.data.pair.trackedReserveBNB,
          totalSupply,

          ...poolInfos[0],
          rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[0],
            rewards: pendingRewards[0],
          },
        })
      }

      return farms.filter(farm => !!farm.totalSupply)
    }

    async function checkForFarms() {
      try {
        if (!fairLaunchContracts) {
          dispatch(setFarmsData({}))
          return
        }

        dispatch(setLoading(true))

        const result: { [key: string]: Farm[] } = {}

        const fairLaunchAddresses = Object.keys(fairLaunchContracts)
        const promises: Promise<Farm[]>[] = fairLaunchAddresses.map(address =>
          getListFarmsForContract(fairLaunchContracts[address]),
        )

        const promiseResult = await Promise.all(promises)
        if (cancelled) throw new Error('canceled')
        fairLaunchAddresses.forEach((address, index) => {
          result[address] = promiseResult[index]
        })

        if (latestChainId.current === chainId && (Object.keys(farmsDataRef.current).length === 0 || !cancelled)) {
          dispatch(setFarmsData(result))
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          dispatch(setYieldPoolsError(err as Error))
        }
      }

      dispatch(setLoading(false))
    }

    checkForFarms()

    const i =
      isInterval &&
      setInterval(() => {
        checkForFarms()
      }, 30_000)

    return () => {
      cancelled = true
      i && clearInterval(i)
    }
  }, [
    dispatch,
    chainId,
    fairLaunchContracts,
    account,
    isEVM,
    networkInfo,
    classicClient,
    blockClient,
    allTokens,
    isInterval,
  ])

  return null
}
