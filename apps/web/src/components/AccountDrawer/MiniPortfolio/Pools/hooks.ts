import { MULTICALL_ADDRESSES, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as V3NFT_ADDRESSES } from '@uniswap/sdk-core'
import NFTPositionManagerJSON from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import MulticallJSON from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { useWeb3React } from '@web3-react/core'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import { RPC_PROVIDERS } from 'constants/providers'
import { BaseContract } from 'ethers/lib/ethers'
import { toContractInput } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import {
  ContractInput,
  useUniswapPricesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getContract } from 'utilities/src/contracts/getContract'
import { CurrencyKey, currencyKey, currencyKeyFromGraphQL } from 'utils/currencyKey'

type ContractMap<T extends BaseContract> = { [key: number]: T }

// Constructs a chain-to-contract map, using the wallet's provider when available
function useContractMultichain<T extends BaseContract>(
  addressMap: { [chainId: number]: string | undefined },
  ABI: any,
  chainIds?: UniverseChainId[],
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

export function useV3ManagerContracts(chainIds: UniverseChainId[]): ContractMap<NonfungiblePositionManager> {
  return useContractMultichain<NonfungiblePositionManager>(V3NFT_ADDRESSES, NFTPositionManagerJSON.abi, chainIds)
}

export function useInterfaceMulticallContracts(chainIds: UniverseChainId[]): ContractMap<UniswapInterfaceMulticall> {
  return useContractMultichain<UniswapInterfaceMulticall>(MULTICALL_ADDRESSES, MulticallJSON.abi, chainIds)
}

type PriceMap = { [key: CurrencyKey]: number | undefined }
export function usePoolPriceMap(positions: PositionInfo[] | undefined) {
  const { defaultChainId } = useEnabledChains()
  const contracts = useMemo(() => {
    if (!positions || !positions.length) {
      return []
    }
    // Avoids fetching duplicate tokens by placing in map
    const contractMap = positions.reduce((acc: { [key: string]: ContractInput }, { pool: { token0, token1 } }) => {
      acc[currencyKey(token0)] = toContractInput(token0, defaultChainId)
      acc[currencyKey(token1)] = toContractInput(token1, defaultChainId)
      return acc
    }, {})
    return Object.values(contractMap)
  }, [defaultChainId, positions])

  const { data, loading } = useUniswapPricesQuery({ variables: { contracts }, skip: !contracts.length })

  const priceMap = useMemo(
    () =>
      data?.tokens?.reduce((acc: PriceMap, current) => {
        if (current) {
          acc[currencyKeyFromGraphQL(current)] = current.project?.markets?.[0]?.price?.value
        }
        return acc
      }, {}) ?? {},
    [data?.tokens],
  )

  return { priceMap, pricesLoading: loading && !data }
}
