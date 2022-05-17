import { useContractKit } from '@celo-tools/use-contractkit'
import { parseEther } from '@ethersproject/units'
import { TokenAmount } from '@ubeswap/sdk'
import { ethers } from 'ethers'
import React, { useEffect } from 'react'
import { AbiItem, fromWei, toBN } from 'web3-utils'

import farmRegistryAbi from '../../constants/abis/FarmRegistry.json'
import { useCustomStakingInfo } from './useCustomStakingInfo'

type FarmData = {
  tvlUSD: string
  rewardsUSDPerYear: string
}

export type FarmSummary = {
  farmName: string
  stakingAddress: string
  lpAddress: string
  rewardsUSDPerYear: string
  tvlUSD: string
  token0Address: string
  token1Address: string
  isFeatured: boolean
  isImported: boolean
  totalRewardRates?: TokenAmount[]
}

const blacklist: Record<string, boolean> = {
  '0x4488682fd16562a68ea0d0f898413e075f42e6da': true,
  '0xC245976Db329Bb0414253376246a367B7c96C762': true,
}

const featuredPoolWhitelist: Record<string, boolean> = {
  '0x6F11B6eA70DEe4f167b1A4ED1F01C903f6781960': false, // PACT
  '0xEfe2f9d62E45815837b4f20c1F44F0A83605B540': false, // ARI
  '0x155DA6F164D925E3a91F510B50DEC08aA03B4071': false, // IMMO
  '0x3c8e2eB988f0890B68b5667C2FB867249E68E3C7': true, // CELO-SYMM
}

const CREATION_BLOCK = 9840049
const LAST_N_BLOCKS = 1440 // Last 2 hours

export interface WarningInfo {
  poolName: string
  link: string
}

export const useFarmRegistry = () => {
  const { kit } = useContractKit()
  const [farmSummaries, setFarmSummaries] = React.useState<FarmSummary[]>([])
  const call = React.useCallback(async () => {
    const farmRegistry = new kit.web3.eth.Contract(
      farmRegistryAbi as AbiItem[],
      '0xa2bf67e12EeEDA23C7cA1e5a34ae2441a17789Ec'
    )
    const lastBlock = await kit.web3.eth.getBlockNumber()
    const [farmInfoEvents, lpInfoEvents, farmDataEvents] = await Promise.all([
      farmRegistry.getPastEvents('FarmInfo', {
        fromBlock: CREATION_BLOCK,
        toBlock: lastBlock,
      }),
      farmRegistry.getPastEvents('LPInfo', { fromBlock: CREATION_BLOCK, toBlock: lastBlock }),
      farmRegistry.getPastEvents('FarmData', {
        fromBlock: lastBlock - LAST_N_BLOCKS,
        toBlock: lastBlock,
      }),
    ])

    const lps: Record<string, [string, string]> = {}
    lpInfoEvents.forEach((e) => {
      lps[e.returnValues.lpAddress] = [e.returnValues.token0Address, e.returnValues.token1Address]
    })
    const farmData: Record<string, FarmData> = {}
    farmDataEvents.forEach((e) => {
      farmData[e.returnValues.stakingAddress] = {
        tvlUSD: e.returnValues.tvlUSD,
        rewardsUSDPerYear: e.returnValues.rewardsUSDPerYear,
      }
    })
    const farmSummaries: FarmSummary[] = []
    farmInfoEvents
      .filter((e) => !blacklist[e.returnValues.stakingAddress.toLowerCase()])
      .forEach((e) => {
        // sometimes there is no farm data for the staking address return early to avoid crash
        if (!farmData[e.returnValues.stakingAddress]) {
          return
        }
        farmSummaries.push({
          farmName: ethers.utils.parseBytes32String(e.returnValues.farmName),
          stakingAddress: e.returnValues.stakingAddress,
          lpAddress: e.returnValues.lpAddress,
          token0Address: lps[e.returnValues.lpAddress][0],
          token1Address: lps[e.returnValues.lpAddress][1],
          tvlUSD: farmData[e.returnValues.stakingAddress].tvlUSD,
          rewardsUSDPerYear: farmData[e.returnValues.stakingAddress].rewardsUSDPerYear,
          isFeatured: !!featuredPoolWhitelist[e.returnValues.stakingAddress],
          isImported: false,
        })
      })

    farmSummaries
      .sort((a, b) => Number(fromWei(toBN(b.rewardsUSDPerYear).sub(toBN(a.rewardsUSDPerYear)))))
      .sort((a, b) => Number(fromWei(toBN(b.tvlUSD).sub(toBN(a.tvlUSD)))))

    setFarmSummaries(farmSummaries)
  }, [kit.web3.eth])

  useEffect(() => {
    call()
  }, [call])

  return farmSummaries
}

export const useImportedFarmRegistry = (farmAddress: string): FarmSummary | undefined => {
  const { stakingToken, totalRewardRates, valueOfTotalStakedAmountInCUSD, tokens } = useCustomStakingInfo(farmAddress)

  if (stakingToken && totalRewardRates && valueOfTotalStakedAmountInCUSD && tokens) {
    const farmSummary: FarmSummary = {
      farmName: '',
      stakingAddress: farmAddress,
      lpAddress: stakingToken?.address,
      token0Address: tokens[0].address,
      token1Address: tokens[1].address,
      isFeatured: false,
      tvlUSD: parseEther(valueOfTotalStakedAmountInCUSD).toString(),
      rewardsUSDPerYear: '0',
      isImported: true,
      totalRewardRates,
    }
    return farmSummary
  }
  return undefined
}

export const useUniqueBestFarms = () => {
  const farmSummaries = useFarmRegistry()
  const farmsUniqueByBestFarm = farmSummaries.reduce((prev: Record<string, FarmSummary>, current) => {
    if (!prev[current.lpAddress]) {
      prev[current.lpAddress] = current
    } else if (
      Number(fromWei(current.rewardsUSDPerYear)) > Number(fromWei(prev[current.lpAddress].rewardsUSDPerYear))
    ) {
      prev[current.lpAddress] = current
    }
    return prev
  }, {})

  return farmsUniqueByBestFarm
}
