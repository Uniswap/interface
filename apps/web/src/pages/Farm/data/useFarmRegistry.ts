import { ApolloClient, ApolloQueryResult, InMemoryCache, gql, useQuery } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { parseBytes32String } from '@ethersproject/strings'
import { formatEther, parseEther } from '@ethersproject/units'
import { CurrencyAmount, Percent, Token } from '@ubeswap/sdk-core'
import { useFarmRegistryContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import React, { useEffect, useMemo } from 'react'
import { FarmDataEvent, FarmInfoEvent, LPInfoEvent } from 'uniswap/src/abis/types/FarmRegistry'
import fetchEvents from 'utils/fetchEvents'

import { CACHED_FARM_INFO_BLOCK, cachedFarmInfoEvents, cachedLpInfoEvents } from './cachedFarmInfo'
import { useCustomStakingInfo } from './useCustomStakingInfo'

const client = new ApolloClient({
  uri: 'https://gateway-arbitrum.network.thegraph.com/api/4271ef6e8196c6631ad397c7be19082a/subgraphs/id/JWDRLCwj4H945xEkbB6eocBSZcYnibqcJPJ8h9davFi',
  cache: new InMemoryCache(),
})

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
  totalStakedAmount?: CurrencyAmount<Token> | undefined
  token0Address: string
  token1Address: string
  isFeatured: boolean
  rewardApr?: Percent
  swapApr?: Percent
  apr?: Percent
  apy?: string
  isImported: boolean
  totalRewardRates?: CurrencyAmount<Token>[]
}

const blacklist: Record<string, boolean> = {
  '0x4488682fd16562a68ea0d0f898413e075f42e6da': true,
  '0xc245976db329bb0414253376246a367b7c96c762': true,
  '0xb5b6a87434f7a0ccc3dcc0de60d1ade3737ad263': true,
}

const featuredPoolWhitelist: Record<string, boolean> = {
  '0x6F11B6eA70DEe4f167b1A4ED1F01C903f6781960': false, // PACT
  '0xEfe2f9d62E45815837b4f20c1F44F0A83605B540': false, // ARI
  '0x155DA6F164D925E3a91F510B50DEC08aA03B4071': false, // IMMO
  '0x3c8e2eB988f0890B68b5667C2FB867249E68E3C7': false, // CELO-SYMM
}

const farmWhitelist: Record<string, boolean> = {
  '0x534408e91d755a0d898e1c508e987e8d0615b52c': true,
  '0x9584870281dd0d764748a2a234e2218ae544c614': true,
  '0xd94e14358f66a3c0d13ae76ec45fe1c92dd7fb23': true,
  '0xfaa5aff67582db0e9e581f52007c428ba71db405': true,
  '0x3c8e2eb988f0890b68b5667c2fb867249e68e3c7': true,
  '0xe4d9cab86f3419102984983e5a611442aaa3d864': true,
  '0x6f79b6b3c00d11dbd05475be1240ad8f2c20bcb6': true,
  '0xfeb0df4542e5394aac89383c135e2fc829812c6c': true,
  '0x04103efcec2d475b43964e0bf976c2a7e5eab2c0': true,
  '0x9caf0cd20c8ef7622eeb8db50e5bb4d407e38ae2': true,
  '0xf4f8a7d430aa5d3bac057610bcbfc18f68d0b66d': true,
  '0xbd61deb4459556d78b2133521af91a13eb21e20e': true,
  '0xbfa2748a60976cd18b835c75c6a20328e9a72684': true,
  '0x54097e406dfc00b9179167f9e20b26406ad42f0f': true,
  '0xf725d0ed5987bd9e7ef725491c584a84e4212708': true,
  '0xb5b6a87434f7a0ccc3dcc0de60d1ade3737ad263': true,
  '0x833febc01260d8f3dcc98393c216a025e90b405d': true,
  '0xed2ef7b098a0056f8fa73215f183ad908ac158f8': true,
  '0x033ae9200dbfc107e84d682f286f315f36ac452d': true,
  '0xda7f463c27ec862cfbf2369f3f74c364d050d93f': true,
  '0x295d6f96081feb1569d9ce005f7f2710042ec6a1': true,
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
const LAST_N_BLOCKS = 1440 // Last 8 hours

export interface WarningInfo {
  poolName: string
  link: string
}

export const useFarmRegistry = () => {
  const farmRegistryContract = useFarmRegistryContract()
  const [farmSummaries, setFarmSummaries] = React.useState<FarmSummary[]>([])
  const olderFarmInfoEvents = useMemo(() => {
    return cachedFarmInfoEvents.filter((e) => !blacklist[e.args.stakingAddress.toLowerCase()]).map((e) => e.args)
  }, [])
  const olderLpInfoEvents = useMemo(() => {
    return cachedLpInfoEvents.map((e) => e.args)
  }, [])

  const call = React.useCallback(async () => {
    if (!farmRegistryContract || !client) return

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
        events.map((e) => ({
          rewardsUSDPerYear: e.args.rewardsUSDPerYear,
          stakingAddress: e.args.stakingAddress.toLowerCase(),
          tvlUSD: e.args.tvlUSD,
        }))
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
        if (!farmData[e.stakingAddress.toLowerCase()] && !farmWhitelist[e.stakingAddress.toLowerCase()]) {
          return
        }
        const fData = farmData[e.stakingAddress] || {
          tvlUSD: '0',
          rewardsUSDPerYear: '0',
        }
        if (!farmSummaries.find((f) => f.lpAddress.toLowerCase() == e.lpAddress.toLowerCase())) {
          farmSummaries.push({
            farmName: parseBytes32String(e.farmName),
            stakingAddress: e.stakingAddress,
            lpAddress: e.lpAddress,
            token0Address: lps[e.lpAddress][0],
            token1Address: lps[e.lpAddress][1],
            tvlUSD: BigNumber.from(fData.tvlUSD),
            rewardsUSDPerYear: BigNumber.from(fData.rewardsUSDPerYear),
            isFeatured: !!featuredPoolWhitelist[e.stakingAddress],
            isImported: false,
          })
        }
      })

    console.log(farmSummaries)

    farmSummaries
      .sort((a, b) => Number(formatEther(b.rewardsUSDPerYear.sub(a.rewardsUSDPerYear))))
      .sort((a, b) => Number(a.tvlUSD && b.tvlUSD ? formatEther(b.tvlUSD.sub(a.tvlUSD)) : 0))

    const label = 'farm' + Math.floor(Math.random() * 100000)
    console.log('start', label)
    console.time(label)
    const results = await Promise.all(
      farmSummaries.map((summary: FarmSummary) => {
        return client.query({ query: pairDataGql, variables: { id: summary.lpAddress.toLowerCase() } })
      })
    )
    console.timeEnd(label)

    const farmInfos = results.map((result: ApolloQueryResult<any>, index) => calcAPR(result, farmSummaries[index]))
    setFarmSummaries(
      farmSummaries.map((summary, index) => ({
        ...summary,
        ...farmInfos[index],
      }))
    )
  }, [farmRegistryContract, olderFarmInfoEvents, olderLpInfoEvents])

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
    client,
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
      totalStakedAmount,
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

  const divideNominalByNAddOne = Number(nominal.divide(JSBI.BigInt(compounds)).add(JSBI.BigInt(ONE)).toFixed(10))

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
