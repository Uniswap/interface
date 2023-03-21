import { Token } from '@uniswap/sdk-core'
import { AddressMap } from '@uniswap/smart-order-router'
import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { abi as NFTPositionManagerABI } from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { useWeb3React } from '@web3-react/core'
import { MULTICALL_ADDRESS, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as V3NFT_ADDRESSES } from 'constants/addresses'
import { isSupportedChain, SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { BaseContract } from 'ethers/lib/ethers'
import { ContractInput, useUniswapPricesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { toContractInput } from 'graphql/data/util'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import { useMemo } from 'react'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'types/v3'
import { getContract } from 'utils'
import { CurrencyKey, currencyKey, currencyKeyFromGraphQL } from 'utils/currencyKey'

import { PositionInfo } from './cache'

type ContractMap<T extends BaseContract> = { [key: number]: T }

// Constructs a chain-to-contract map, using the wallet's provider when available
function useContractMultichain<T extends BaseContract>(
  addressMap: AddressMap,
  ABI: any,
  chainIds?: SupportedChainId[]
): ContractMap<T> {
  const { chainId: walletChainId, provider: walletProvider } = useWeb3React()

  return useMemo(() => {
    const relevantChains =
      chainIds ??
      Object.keys(addressMap)
        .map((chainId) => parseInt(chainId))
        .filter(isSupportedChain)

    return relevantChains.reduce((acc: ContractMap<T>, chainId) => {
      const provider = walletProvider && walletChainId === chainId ? walletProvider : RPC_PROVIDERS[chainId]
      acc[chainId] = getContract(addressMap[chainId], ABI, provider) as T
      return acc
    }, {})
  }, [ABI, addressMap, chainIds, walletChainId, walletProvider])
}

export function useV3ManagerContracts(chainIds: SupportedChainId[]): ContractMap<NonfungiblePositionManager> {
  return useContractMultichain<NonfungiblePositionManager>(V3NFT_ADDRESSES, NFTPositionManagerABI, chainIds)
}

export function useInterfaceMulticallContracts(chainIds: SupportedChainId[]): ContractMap<UniswapInterfaceMulticall> {
  return useContractMultichain<UniswapInterfaceMulticall>(MULTICALL_ADDRESS, MulticallABI, chainIds)
}

type PriceMap = { [key: CurrencyKey]: number | undefined }
export function usePoolPriceMap(positions: PositionInfo[] | undefined) {
  const contracts = useMemo(() => {
    if (!positions || !positions.length) return []
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
        if (current) acc[currencyKeyFromGraphQL(current)] = current.project?.markets?.[0]?.price?.value
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
