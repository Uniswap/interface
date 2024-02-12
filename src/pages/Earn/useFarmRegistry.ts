import { ApolloQueryResult, gql, useApolloClient, useQuery } from '@apollo/client'
import { useCelo } from '@celo/react-celo'
import { BigNumber } from '@ethersproject/bignumber'
import { formatEther, parseEther } from '@ethersproject/units'
import { ChainId, Percent, TokenAmount } from '@ubeswap/sdk'
import { ethers } from 'ethers'
import { FarmDataEvent, FarmInfoEvent, LPInfoEvent } from 'generated/FarmRegistry'
import { useFarmRegistryContract } from 'hooks/useContract'
import React, { useEffect, useMemo } from 'react'
import fetchEvents from 'utils/fetchEvents'

import { farmRegistryAddresses } from '../../constants'
import { CACHED_FARM_INFO_BLOCK, cachedFarmInfoEvents, cachedLpInfoEvents } from './cachedFarmInfo'
import { useCustomStakingInfo } from './useCustomStakingInfo'

type FarmData = {
  tvlUSD: string
  rewardsUSDPerYear: string
}

export type FarmSummary = {
  farmName: string
  stakingAddress: string
  lpAddress: string
  rewardsUSDPerYear: BigNumber
  tvlUSD: BigNumber | undefined
  totalStakedAmount?: TokenAmount | undefined
  token0Address: string
  token1Address: string
  isFeatured: boolean
  rewardApr?: Percent
  swapApr?: Percent
  apr?: Percent
  apy?: string
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
  '0x3c8e2eB988f0890B68b5667C2FB867249E68E3C7': false, // CELO-SYMM
}

const pairDataGql = gql`
  query getPairHourData($id: String!) {
    pair(id: $id) {
      pairHourData(first: 24, orderBy: hourStartUnix, orderDirection: desc) {
        hourStartUnix
        hourlyVolumeUSD
      }
    }
  }
`
const COMPOUNDS_PER_YEAR = 2
const LAST_N_BLOCKS = 5760 // Last 8 hours

export interface WarningInfo {
  poolName: string
  link: string
}

export const useFarmRegistry = () => {
  const { network } = useCelo()
  const farmRegistryAddress = farmRegistryAddresses[network.chainId as ChainId]
  const farmRegistryContract = useFarmRegistryContract(farmRegistryAddress)
  const client = useApolloClient()
  const [farmSummaries, setFarmSummaries] = React.useState<FarmSummary[]>([])
  const olderFarmInfoEvents = useMemo(() => {
    return cachedFarmInfoEvents.map((e) => e.returnValues)
  }, [])
  const olderLpInfoEvents = useMemo(() => {
    return cachedLpInfoEvents.map((e) => e.returnValues)
  }, [])

  const call = React.useCallback(async () => {
    if (!farmRegistryAddress || !farmRegistryContract || !client) return

    const farmInfoFilter = farmRegistryContract.filters.FarmInfo()
    const lpInfoFilter = farmRegistryContract.filters.LPInfo()
    const farmDataFilter = farmRegistryContract.filters.FarmData()
    const [farmInfoEvents, lpInfoEvents, farmDataEvents] = await Promise.all([
      fetchEvents<FarmInfoEvent>(farmRegistryContract, farmInfoFilter, CACHED_FARM_INFO_BLOCK, 'latest').then(
        (events) => {
          const onlyArgs = events.map((e) => e.args)
          return olderFarmInfoEvents.concat(onlyArgs)
        }
      ),
      fetchEvents<LPInfoEvent>(farmRegistryContract, lpInfoFilter, CACHED_FARM_INFO_BLOCK, 'latest').then((events) => {
        const onlyArgs = events.map((e) => e.args)
        return olderLpInfoEvents.concat(onlyArgs)
      }),
      fetchEvents<FarmDataEvent>(farmRegistryContract, farmDataFilter, -LAST_N_BLOCKS, 'latest').then((events) =>
        events.map((e) => e.args)
      ),
    ])

    const lps: Record<string, [string, string]> = {}
    lpInfoEvents.forEach((e) => {
      lps[e.lpAddress] = [e.token0Address, e.token1Address]
    })
    const farmData: Record<string, FarmData> = {}
    farmDataEvents.forEach((e) => {
      farmData[e.stakingAddress] = {
        tvlUSD: e.tvlUSD.toString(),
        rewardsUSDPerYear: e.rewardsUSDPerYear.toString(),
      }
    })
    const farmSummaries: FarmSummary[] = []
    farmInfoEvents
      .filter((e) => !blacklist[e.stakingAddress.toLowerCase()])
      .forEach((e) => {
        // sometimes there is no farm data for the staking address return early to avoid crash
        if (!farmData[e.stakingAddress]) {
          return
        }
        farmSummaries.push({
          farmName: ethers.utils.parseBytes32String(e.farmName),
          stakingAddress: e.stakingAddress,
          lpAddress: e.lpAddress,
          token0Address: lps[e.lpAddress][0],
          token1Address: lps[e.lpAddress][1],
          tvlUSD: BigNumber.from(farmData[e.stakingAddress].tvlUSD),
          rewardsUSDPerYear: BigNumber.from(farmData[e.stakingAddress].rewardsUSDPerYear),
          isFeatured: !!featuredPoolWhitelist[e.stakingAddress],
          isImported: false,
        })
      })

    farmSummaries
      .sort((a, b) => Number(formatEther(b.rewardsUSDPerYear.sub(a.rewardsUSDPerYear))))
      .sort((a, b) => Number(a.tvlUSD && b.tvlUSD ? formatEther(b.tvlUSD.sub(a.tvlUSD)) : 0))

    const results = await Promise.all(
      farmSummaries.map((summary) => {
        return client.query({ query: pairDataGql, variables: { id: summary.lpAddress.toLowerCase() } })
      })
    )
    const farmInfos = results.map((result: ApolloQueryResult<any>, index) => calcAPR(result, farmSummaries[index]))
    setFarmSummaries(
      farmSummaries.map((summary, index) => ({
        ...summary,
        ...farmInfos[index],
      }))
    )
  }, [farmRegistryAddress, farmRegistryContract, client, olderFarmInfoEvents, olderLpInfoEvents])

  useEffect(() => {
    call()
  }, [call])

  return farmSummaries
}

export const useImportedFarmRegistry = (farmAddress: string): FarmSummary | undefined => {
  const {
    stakingToken,
    totalRewardRates,
    valueOfTotalStakedAmountInCUSD,
    tokens,
    rewardsUSDPerYear,
    totalStakedAmount,
  } = useCustomStakingInfo(farmAddress)

  const result = useQuery(pairDataGql, {
    variables: { id: stakingToken?.address.toLowerCase() },
  })

  if (stakingToken && totalRewardRates && tokens) {
    const farmSummary: FarmSummary = {
      farmName: '',
      stakingAddress: farmAddress,
      lpAddress: stakingToken?.address,
      token0Address: tokens[0].address,
      token1Address: tokens[1].address,
      isFeatured: false,
      tvlUSD: valueOfTotalStakedAmountInCUSD ? parseEther(valueOfTotalStakedAmountInCUSD) : undefined,
      totalStakedAmount: totalStakedAmount,
      rewardsUSDPerYear: BigNumber.from(rewardsUSDPerYear),
      isImported: true,
      totalRewardRates,
    }
    const farmInfo = calcAPR(result, farmSummary)
    return { ...farmSummary, ...farmInfo }
  }
  return undefined
}

export const useUniqueBestFarms = () => {
  const farmSummaries = useFarmRegistry()
  const farmsUniqueByBestFarm = farmSummaries.reduce((prev: Record<string, FarmSummary>, current) => {
    if (!prev[current.lpAddress]) {
      prev[current.lpAddress] = current
    } else if (current.rewardsUSDPerYear.gt(prev[current.lpAddress].rewardsUSDPerYear)) {
      prev[current.lpAddress] = current
    }
    return prev
  }, {})

  return farmsUniqueByBestFarm
}

// formula is 1 + ((nom/compoundsPerYear)^compoundsPerYear) - 1
function annualizedPercentageYield(nominal: Percent, compounds: number) {
  const ONE = 1

  const divideNominalByNAddOne = Number(nominal.divide(BigInt(compounds)).add(BigInt(ONE)).toFixed(10))

  // multiply 100 to turn decimal into percent, to fixed since we only display integer
  return ((divideNominalByNAddOne ** compounds - ONE) * 100).toFixed(0)
}

// calculate rewardAPR, swapAPR, APY & APR from a farmSummary
function calcAPR(
  result: ApolloQueryResult<any>,
  summary: FarmSummary
): {
  rewardApr: Percent
  swapApr: Percent
  apr: Percent
  apy: string
} {
  let swapRewardsUSDPerYear: BigNumber = BigNumber.from(0)
  const { loading, error, data } = result
  if (!loading && !error && data?.pair) {
    const lastDayVolumeUsd = data.pair.pairHourData.reduce(
      (acc: number, curr: { hourlyVolumeUSD: string }) => acc + Number(curr.hourlyVolumeUSD),
      0
    )
    swapRewardsUSDPerYear = parseEther(Math.floor(lastDayVolumeUsd * 365 * 0.0025).toString())
  }
  const rewardApr = new Percent(summary.rewardsUSDPerYear.toString(), summary.tvlUSD?.toString())
  const swapApr = new Percent(swapRewardsUSDPerYear.toString(), summary.tvlUSD?.toString())
  const apr = new Percent(swapRewardsUSDPerYear.add(summary.rewardsUSDPerYear).toString(), summary.tvlUSD?.toString())
  let apy = '0'
  if (summary.tvlUSD?.gt(0)) {
    try {
      apy = annualizedPercentageYield(apr, COMPOUNDS_PER_YEAR)
    } catch (e) {
      console.error('apy calc overflow', summary.farmName, e)
    }
  }
  return {
    rewardApr,
    swapApr,
    apr,
    apy,
  }
}
