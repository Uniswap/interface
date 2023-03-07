import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Fraction, Token } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { MAX_ALLOW_APY, OUTSIDE_FAIRLAUNCH_ADDRESSES, ZERO_ADDRESS } from 'constants/index'
import { DEFAULT_REWARDS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { useFairLaunchContracts } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import { AppState } from 'state'
import { useBlockNumber, useETHPrice, useKyberSwapConfig, useTokensPrice } from 'state/application/hooks'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { getBulkPoolDataFromPoolList } from 'state/pools/hooks'
import { isAddressString } from 'utils'
import { getTradingFeeAPR, useFarmApr } from 'utils/dmm'

import { setFarmsData, setLoading, setYieldPoolsError } from './actions'

export const useRewardTokens = () => {
  const { chainId, isEVM, networkInfo } = useActiveWeb3React()
  const rewardTokensMulticallResult = useMultipleContractSingleData(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunch : [],
    new Interface(FAIRLAUNCH_ABI),
    'getRewardTokens',
  )

  const rewardTokensV2MulticallResult = useMultipleContractSingleData(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunchV2 : [],
    new Interface(FAIRLAUNCH_V2_ABI),
    'getRewardTokens',
  )

  const defaultRewards = useMemo(() => {
    return DEFAULT_REWARDS[chainId] || []
  }, [chainId])

  return useMemo(() => {
    let result: string[] = []

    rewardTokensMulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    rewardTokensV2MulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    return [...defaultRewards, ...result]
  }, [rewardTokensMulticallResult, rewardTokensV2MulticallResult, defaultRewards])
}

export const useRewardTokenPrices = (tokens: (Token | undefined | null)[], version?: VERSION) => {
  const tokenPrices = useTokensPrice(tokens, version)
  const marketPrices = useTokensMarketPrice(tokens)

  return useMemo(
    () => tokenPrices.map((price, index) => marketPrices[index] || price || 0),
    [tokenPrices, marketPrices],
  )
}

export const useFarmsData = (isIncludeOutsideFarms = true) => {
  const dispatch = useAppDispatch()
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const fairLaunchContracts = useFairLaunchContracts(false)
  const ethPrice = useETHPrice()
  const allTokens = useAllTokens()
  const { classicClient, blockClient } = useKyberSwapConfig()

  const farmsData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  const farmsDataRef = useRef(farmsData)
  useEffect(() => {
    farmsDataRef.current = farmsData
  }, [farmsData])

  // Fix slow network speed when loading farm.
  const latestChainId = useRef(chainId)
  useEffect(() => {
    latestChainId.current = chainId
  }, [chainId])

  useEffect(() => {
    if (!isEVM) return
    let cancelled = false

    async function getListFarmsForContract(contract: Contract): Promise<Farm[]> {
      if (!isEVM) return []
      const rewardTokenAddresses: string[] = await contract?.getRewardTokens()
      const poolLength = await contract?.poolLength()

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const isV2 = (networkInfo as EVMNetworkInfo).classic.fairlaunchV2.includes(contract.address)
      const poolInfos = await Promise.all(
        pids.map(async (pid: number) => {
          const poolInfo = await contract?.getPoolInfo(pid)
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

          return stakedBalance.amount
        }),
      )

      const pendingRewards = await Promise.all(
        pids.map(async (pid: number) => {
          const pendingRewards = account ? await contract?.pendingRewards(pid, account as string) : null

          return pendingRewards
        }),
      )

      const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

      const farmsData = await getBulkPoolDataFromPoolList(
        poolAddresses,
        classicClient,
        blockClient,
        chainId,
        ethPrice.currentPrice,
      )

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
      if (isIncludeOutsideFarms && outsideFarm) {
        const poolData = await fetch(outsideFarm.subgraphAPI, {
          method: 'POST',
          body: JSON.stringify({
            query: outsideFarm.query,
          }),
        }).then(res => res.json())

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
        const promises: Promise<Farm[]>[] = []

        fairLaunchAddresses.forEach(address => {
          promises.push(getListFarmsForContract(fairLaunchContracts[address]))
        })

        const promiseResult = await Promise.all(promises)

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

    const i = setInterval(() => {
      checkForFarms()
    }, 15_000)

    return () => {
      cancelled = true
      clearInterval(i)
    }
  }, [
    dispatch,
    ethPrice.currentPrice,
    chainId,
    fairLaunchContracts,
    account,
    allTokens,
    isIncludeOutsideFarms,
    isEVM,
    networkInfo,
    classicClient,
    blockClient,
  ])

  return useMemo(() => ({ loading, error, data: farmsData }), [error, farmsData, loading])
}

export const useActiveAndUniqueFarmsData = (): { loading: boolean; error: string; data: Farm[] } => {
  const farmsData = useFarmsData(false)
  const blockNumber = useBlockNumber()

  return useMemo(() => {
    const currentTimestamp = Math.round(Date.now() / 1000)
    const { loading, error, data: farms } = farmsData

    const existedPairs: { [key: string]: boolean } = {}
    const uniqueAndActiveFarms = Object.values(farms)
      .flat()
      .filter(farm =>
        farm.version === FairLaunchVersion.V1 ? farm.endBlock > (blockNumber || -1) : farm.endTime > currentTimestamp,
      )
      .filter(farm => {
        const pairKey = `${farm.token0?.symbol} - ${farm.token1?.symbol}`
        if (existedPairs[pairKey]) return false
        existedPairs[pairKey] = true
        return true
      })

    return {
      loading,
      error,
      data: uniqueAndActiveFarms,
    }
  }, [blockNumber, farmsData])
}

export const useTotalApr = (farm: Farm) => {
  const { chainId } = useActiveWeb3React()
  const poolAddressChecksum = isAddressString(chainId, farm.id)
  const { decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)
  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farm, liquidity.toString())
  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)
  const apr = farmAPR + (tradingFeeAPR < MAX_ALLOW_APY ? tradingFeeAPR : 0)

  return { tradingFeeAPR, farmAPR, apr }
}
