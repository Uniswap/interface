import { BigNumber } from '@ethersproject/bignumber'
import { useQuery } from '@tanstack/react-query'
import { ChainId, CurrencyAmount, Fraction, Percent, Token } from '@ubeswap/sdk-core'
import CID from 'cids'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { CELO_CELO, UBE } from 'constants/tokens'
import { formatEther } from 'ethers/lib/utils'
import { OrderDirection } from 'graphql/data/util'
import { useDefaultActiveTokens } from 'hooks/Tokens'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useAtomValue } from 'jotai/utils'
import { hexToUint8Array } from 'lib/utils/contenthashToUri'
import { toB58String } from 'multihashes'
import { useFarmRegistry } from 'pages/Farm/data/useFarmRegistry'
import { useIncentiveContractInfo } from 'pages/FarmV3/farm-actions'
import { useEffect, useMemo, useState } from 'react'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isAddress } from 'utilities/src/addresses'

export function sortFarms(pools: TableFarm[], sortState: FarmTableSortState) {
  return pools.sort((a, b) => {
    switch (sortState.sortBy) {
      case FarmSortFields.APR:
        if (a.apr.equalTo(b.apr)) {
          if (a.farmAddress == '0x534408e91d755a0d898e1c508e987e8d0615b52c') {
            return -1
          } else if (b.farmAddress == '0x534408e91d755a0d898e1c508e987e8d0615b52c') {
            return 1
          }
        }

        return sortState.sortDirection === OrderDirection.Desc
          ? b.apr.greaterThan(a.apr)
            ? 1
            : -1
          : a.apr.greaterThan(b.apr)
          ? 1
          : -1
      case FarmSortFields.TVL:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
      default:
        return sortState.sortDirection === OrderDirection.Desc ? b.tvl - a.tvl : a.tvl - b.tvl
    }
  })
}

export const V2_BIPS = 3000

export interface TableFarm {
  hash: string
  farmAddress: string
  poolAddress: string
  token0: Token
  token1: Token
  token0Amount: Fraction
  token1Amount: Fraction
  tvl: number
  apr: Percent
  feeTier: number
  protocolVersion: ProtocolVersion
  incentiveIds: string[]
}

export enum FarmSortFields {
  TVL = 'TVL',
  APR = 'APR',
}

export type FarmTableSortState = {
  sortBy: FarmSortFields
  sortDirection: OrderDirection
}

function useFilteredFarms(pools: TableFarm[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      pools.filter((pool) => {
        const addressIncludesFilterString = pool.hash.toLowerCase().includes(lowercaseFilterString)
        const token0IncludesFilterString = pool.token0?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token1IncludesFilterString = pool.token1?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token0HashIncludesFilterString = pool.token0?.address?.toLowerCase().includes(lowercaseFilterString)
        const token1HashIncludesFilterString = pool.token1?.address?.toLowerCase().includes(lowercaseFilterString)
        const poolName = `${pool.token0?.symbol}/${pool.token1?.symbol}`.toLowerCase()
        const poolNameIncludesFilterString = poolName.includes(lowercaseFilterString)
        return (
          token0IncludesFilterString ||
          token1IncludesFilterString ||
          addressIncludesFilterString ||
          token0HashIncludesFilterString ||
          token1HashIncludesFilterString ||
          poolNameIncludesFilterString
        )
      }),
    [lowercaseFilterString, pools]
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useInactiveFarms(sortState: FarmTableSortState, chainId?: ChainId) {
  const farms = useFarmRegistry()
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const loading = farms.length == 0

  const unfilteredPools = useMemo(() => {
    const fff: TableFarm[] =
      farms
        .map((farm) => {
          const token0Address = isAddress(farm.token0Address)
          const token1Address = isAddress(farm.token1Address)
          if (token0Address && tokens[token0Address] && token1Address && tokens[token1Address]) {
            return {
              hash: farm.stakingAddress,
              farmAddress: farm.stakingAddress,
              poolAddress: '',
              token0: tokens[token0Address],
              token1: tokens[token1Address],
              token0Amount: new Fraction(0),
              token1Amount: new Fraction(0),
              tvl: farm.tvlUSD ? Number(formatEther(farm.tvlUSD)) : 0,
              apr: new Percent(0),
              feeTier: V2_BIPS,
              protocolVersion: 'V2',
              incentiveIds: [],
            } as TableFarm
          }
          console.error('this should not happen')
          return []
        })
        .flat() ?? []

    const rt = sortFarms([...fff], sortState)
    return rt
  }, [farms, tokens, sortState])

  const filteredFarms = useFilteredFarms(unfilteredPools).slice(0, 100)
  return { farms: filteredFarms, loading }
}

interface Metadata {
  platform: string
  farmContract: string
  chainId: number
  incentiveId: string
  blocknumber: number
  timestamp: number
  duration: number
  distributedRewards: string
  totalDistributedRewards: string
  merkleRoot: string
  activeTvlNative: string
  activeTokenCount: number
  inactiveTvlNative: string
  inactiveTokenCount: number
  unstakedTokenCount: number
  totalShares: string
  dataFile: string
}

async function fetchMetadata(incentiveId: string, _ipfsHash: string): Promise<Metadata | undefined> {
  if (!_ipfsHash) {
    return
  }
  let data = {
    platform: 'Ubeswap',
    farmContract: '0xA6E9069CB055a425Eb41D185b740B22Ec8f51853',
    chainId: 42220,
    incentiveId,
    timestamp: 0,
    blocknumber: 0,
    duration: 1,
    distributedRewards: '0',
    totalDistributedRewards: '0',
    merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    activeTvlNative: '0',
    activeTokenCount: 0,
    inactiveTvlNative: '0',
    inactiveTokenCount: 0,
    unstakedTokenCount: 0,
    totalShares: '0',
    dataFile: './data.json',
  }
  if (_ipfsHash != '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const ipfsHash = _ipfsHash.replace(/^0x/, '')
    const cidV0 = new CID(toB58String(hexToUint8Array('1220' + ipfsHash)))
    const cidV1Str = cidV0.toV1().toString()
    const res = await fetch('https://scarlet-bored-roundworm-446.mypinata.cloud/ipfs/' + cidV1Str + '/metadata.json')
    data = (await res.json()) as Metadata
  }
  return data
}

export function useV3IncentiveMetadata(incentiveId: string): Metadata | undefined {
  const incentiveInfo = useIncentiveContractInfo(incentiveId)
  const { data: metadata } = useQuery({
    queryKey: ['farm-metadata', incentiveInfo?.ipfsHash || ''],
    queryFn: () => fetchMetadata(incentiveId, incentiveInfo?.ipfsHash || ''),
    enabled: !!incentiveInfo,
    staleTime: 1000_0000,
  })

  return metadata
}

export interface IncentiveDataItem {
  tokenId: BigNumber
  accumulatedRewards: BigNumber
  lastSecondsInsideOfTickRange: number
  tvlNative: BigNumber
  shares: BigNumber
  duration: number
  activeDuration: number
  merkleProof: string[] | null
  isStaked: boolean
  isActive: boolean
}

async function fetchIncentiveFullData(
  incentiveId: string,
  _ipfsHash: string
): Promise<IncentiveDataItem[] | undefined> {
  if (!_ipfsHash) {
    return
  }
  let result: IncentiveDataItem[] = []
  if (_ipfsHash != '0x0000000000000000000000000000000000000000000000000000000000000000') {
    const ipfsHash = _ipfsHash.replace(/^0x/, '')
    const cidV0 = new CID(toB58String(hexToUint8Array('1220' + ipfsHash)))
    const cidV1Str = cidV0.toV1().toString()
    const res = await fetch('https://scarlet-bored-roundworm-446.mypinata.cloud/ipfs/' + cidV1Str + '/data.json')
    const data = await res.json()
    data.forEach((d: any) => {
      d.tokenId = BigNumber.from(d.tokenId)
      d.accumulatedRewards = BigNumber.from(d.accumulatedRewards)
      d.tvlNative = BigNumber.from(d.tvlNative)
      d.shares = BigNumber.from(d.shares)
    })
    result = data as IncentiveDataItem[]
  }
  return result
}

export function useV3IncentiveFullData(incentiveId: string): IncentiveDataItem[] | undefined {
  const incentiveInfo = useIncentiveContractInfo(incentiveId)
  const { data } = useQuery({
    queryKey: ['farm-fulldata', incentiveInfo?.ipfsHash || ''],
    queryFn: () => fetchIncentiveFullData(incentiveId, incentiveInfo?.ipfsHash || ''),
    enabled: !!incentiveInfo,
    staleTime: 1000_0000,
  })

  return data
}

function getV3FarmNumbers(metadata: Metadata, nativePrice: number, ubePrice: number): { apr: Percent; tvl: number } {
  const activeTvlNative = parseFloat(formatEther(BigNumber.from(metadata.activeTvlNative)))
  const inactiveTvlNative = parseFloat(formatEther(BigNumber.from(metadata.inactiveTvlNative)))
  const ubeYearlyReward = parseFloat(
    formatEther(
      BigNumber.from(metadata.distributedRewards)
        .mul(365 * 24 * 60 * 60)
        .div(metadata.duration)
    )
  )
  const ubeYearlyRewardUsd = ubeYearlyReward * ubePrice
  console.log('ubeYearlyRewardUsd', ubeYearlyRewardUsd)
  let apr = new Percent(0)
  if (activeTvlNative * nativePrice > 0) {
    apr = new Percent(Math.round(ubeYearlyRewardUsd * 1_000_000), Math.round(activeTvlNative * nativePrice * 1_000_000))
  }

  return {
    apr,
    tvl: (activeTvlNative + inactiveTvlNative) * nativePrice,
  }
}

export function useV3Farms(): TableFarm[] {
  const tokens = useDefaultActiveTokens(ChainId.CELO)
  const [farms, setFarms] = useState<TableFarm[]>([])
  const nativePrice = useUSDPrice(CurrencyAmount.fromRawAmount(CELO_CELO, 1e18)).data
  const ubePrice = useUSDPrice(CurrencyAmount.fromRawAmount(UBE[ChainId.CELO], 1e18)).data
  const metadataUbe = useV3IncentiveMetadata('0xeec6459eb0d7379623c6b1d8b323cc64dea67f43e6ca85e8909a27424d21e812')
  const metadataGlo = useV3IncentiveMetadata('0x82774b5b1443759f20679a61497abf11115a4d0e2076caedf9d700a8c53f286f')

  useEffect(() => {
    if (metadataUbe && metadataGlo && nativePrice && ubePrice) {
      try {
        const ubeNumbers = getV3FarmNumbers(metadataUbe, nativePrice, ubePrice)
        const gloNumbers = getV3FarmNumbers(metadataGlo, nativePrice, ubePrice)
        setFarms([
          {
            hash: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19-v3',
            farmAddress: '0x13b0a5Bf2589d603BB735c79813ee1AA6C12FB1d',
            poolAddress: '0x3efc8d831b754d3ed58a2b4c37818f2e69dadd19',
            token0: tokens['0x471EcE3750Da237f93B8E339c536989b8978a438'],
            token1: tokens['0x71e26d0E519D14591b9dE9a0fE9513A398101490'],
            token0Amount: new Fraction(0),
            token1Amount: new Fraction(0),
            tvl: ubeNumbers.tvl,
            apr: ubeNumbers.apr,
            feeTier: 100,
            protocolVersion: ProtocolVersion.V3,
            incentiveIds: ['0xeec6459eb0d7379623c6b1d8b323cc64dea67f43e6ca85e8909a27424d21e812'],
          },
          {
            hash: '0x28ade0134b9d0bc7041f4e5ea74fecb58504720b-v3',
            farmAddress: '0x13b0a5Bf2589d603BB735c79813ee1AA6C12FB1d',
            poolAddress: '0x28ade0134b9d0bc7041f4e5ea74fecb58504720b',
            token0: tokens['0x4F604735c1cF31399C6E711D5962b2B3E0225AD3'],
            token1: tokens['0xcebA9300f2b948710d2653dD7B07f33A8B32118C'],
            token0Amount: new Fraction(0),
            token1Amount: new Fraction(0),
            tvl: gloNumbers.tvl,
            apr: gloNumbers.apr,
            feeTier: 100,
            protocolVersion: ProtocolVersion.V3,
            incentiveIds: ['0x82774b5b1443759f20679a61497abf11115a4d0e2076caedf9d700a8c53f286f'],
          },
        ])
      } catch (e) {
        console.error(e)
      }
    }
  }, [tokens, metadataUbe, metadataGlo, nativePrice, ubePrice])

  return farms
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useActiveFarms(sortState: FarmTableSortState, chainId?: ChainId) {
  const v3Farms = useV3Farms()
  const loading = v3Farms.length == 0

  const unfilteredPools = useMemo(() => {
    return sortFarms(v3Farms, sortState)
  }, [sortState, v3Farms])

  const filteredFarms = useFilteredFarms(unfilteredPools).slice(0, 100)
  return { farms: filteredFarms, loading }
}
