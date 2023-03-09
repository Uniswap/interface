import { Interface } from '@ethersproject/abi'
import { Fraction, Token } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { MAX_ALLOW_APY, OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { DEFAULT_REWARDS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import { AppState } from 'state'
import { useBlockNumber, useTokensPrice } from 'state/application/hooks'
import { FairLaunchVersion, Farm } from 'state/farms/classic/types'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { isAddressString } from 'utils'
import { getTradingFeeAPR, useFarmApr } from 'utils/dmm'

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
  const farmData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  const data = useMemo(() => {
    const result: {
      [key: string]: Farm[]
    } = {}
    const outsideFirlaunchAddress = Object.keys(OUTSIDE_FAIRLAUNCH_ADDRESSES).map(address => address.toLowerCase())
    Object.keys(farmData)
      .filter(address => isIncludeOutsideFarms || !outsideFirlaunchAddress.includes(address.toLowerCase()))
      .forEach(address => (result[address] = farmData[address]))
    return result
  }, [farmData, isIncludeOutsideFarms])

  return useMemo(() => ({ loading, error, data }), [error, data, loading])
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
