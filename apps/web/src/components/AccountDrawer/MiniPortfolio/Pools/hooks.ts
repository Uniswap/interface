import {
  ChainId,
  MULTICALL_ADDRESSES,
  Token,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as V3NFT_ADDRESSES,
} from '@taraswap/sdk-core'
import type { AddressMap } from '@taraswap/smart-order-router'
import NFTPositionManagerJSON from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import MulticallJSON from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { useWeb3React } from '@web3-react/core'
import { useIsSupportedChainIdCallback } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { BaseContract } from 'ethers/lib/ethers'
import { toContractInput } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useMemo } from 'react'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import {
  ContractInput,
  useUniswapPricesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getContract } from 'utilities/src/contracts/getContract'
import { CurrencyKey, currencyKey, currencyKeyFromGraphQL } from 'utils/currencyKey'
import { PositionInfo } from './cache'

type ContractMap<T extends BaseContract> = { [key: number]: T }

// Constructs a chain-to-contract map, using the wallet's provider when available
export function useContractMultichain<T extends BaseContract>(
  addressMap: AddressMap,
  ABI: any,
  chainIds?: ChainId[]
): ContractMap<T> {
  const account = useAccount()
  const { provider: walletProvider } = useWeb3React()
  const isSupportedChain = useIsSupportedChainIdCallback()

  return useMemo(() => {
    const relevantChains =
      chainIds ??
      Object.keys(addressMap)
        .map((chainId) => parseInt(chainId))
        .filter((chainId) => isSupportedChain(chainId))

    return relevantChains.reduce((acc: ContractMap<T>, chainId) => {
      const provider =
        walletProvider && account.chainId === chainId
          ? walletProvider
          : isSupportedChain(chainId)
          ? RPC_PROVIDERS[chainId]
          : undefined
      if (provider) {
        acc[chainId] = getContract(addressMap[chainId] ?? '', ABI, provider) as T
      }
      return acc
    }, {})
  }, [ABI, addressMap, chainIds, isSupportedChain, account.chainId, walletProvider])
}

export function useV3ManagerContracts(chainIds: ChainId[]): ContractMap<NonfungiblePositionManager> {
  return useContractMultichain<NonfungiblePositionManager>(V3NFT_ADDRESSES, NFTPositionManagerJSON.abi, chainIds)
}

export function useInterfaceMulticallContracts(chainIds: ChainId[]): ContractMap<UniswapInterfaceMulticall> {
  return useContractMultichain<UniswapInterfaceMulticall>(MULTICALL_ADDRESSES, MulticallJSON.abi, chainIds)
}

type PriceMap = { [key: CurrencyKey]: number | undefined }
export function usePoolPriceMap(positions: PositionInfo[] | undefined) {
  const contracts = useMemo(() => {
    if (!positions || !positions.length) {
      return []
    }
    // Avoids fetching duplicate tokens by placing in map
    const contractMap = positions.reduce((acc: { [key: string]: ContractInput }, { pool: { token0, token1 } }) => {
      acc[currencyKey(token0)] = toContractInput(token0)
      acc[currencyKey(token1)] = toContractInput(token1)
      return acc
    }, {})
    return Object.values(contractMap)
  }, [positions])

  const { data, loading } = useUniswapPricesQuery({ variables: { contracts }, skip: !contracts.length })

  const priceMap = useMemo(
    () =>
      data?.tokens?.reduce((acc: PriceMap, current) => {
        if (current) {
          acc[currencyKeyFromGraphQL(current)] = current.project?.markets?.[0]?.price?.value
        }
        return acc
      }, {}) ?? {},
    [data?.tokens]
  )

  return { priceMap, pricesLoading: loading && !data }
}

function useFeeValue(token: Token, fee: number | undefined, queriedPrice: number | undefined) {
  const stablecoinPrice = useStablecoinPrice(!queriedPrice ? token : undefined)
  return useMemo(() => {
    // Prefers gql price, as fetching stablecoinPrice will trigger multiple infura calls for each pool position
    const price = queriedPrice ?? (stablecoinPrice ? parseFloat(stablecoinPrice.toSignificant()) : undefined)
    const feeValue = fee && price ? fee * price : undefined

    return [price, feeValue]
  }, [fee, queriedPrice, stablecoinPrice])
}

export function useFeeValues(position: PositionInfo) {
  const [priceA, feeValueA] = useFeeValue(position.pool.token0, position.fees?.[0], position.prices?.[0])
  const [priceB, feeValueB] = useFeeValue(position.pool.token1, position.fees?.[1], position.prices?.[1])

  return { priceA, priceB, fees: (feeValueA || 0) + (feeValueB || 0) }
}
