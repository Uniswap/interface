import { Contract } from '@ethersproject/contracts'
import {
  CHAIN_TO_ADDRESSES_MAP,
  MULTICALL_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  V3_MIGRATOR_ADDRESSES,
} from '@uniswap/sdk-core'
import IUniswapV2PairJson from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import UniswapInterfaceMulticallJson from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import NonfungiblePositionManagerJson from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import V3MigratorJson from '@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useEffect, useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20, Erc721, Weth } from 'uniswap/src/abis/types'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'uniswap/src/abis/types/v3'
import { V3Migrator } from 'uniswap/src/abis/types/v3/V3Migrator'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getContract } from 'utilities/src/contracts/getContract'
import { logger } from 'utilities/src/logger/logger'

const { abi: IUniswapV2PairABI } = IUniswapV2PairJson
const { abi: MulticallABI } = UniswapInterfaceMulticallJson
const { abi: NFTPositionManagerABI } = NonfungiblePositionManagerJson
const { abi: V2MigratorABI } = V3MigratorJson

// returns null on errors
export function useContract<T extends Contract = Contract>({
  address,
  ABI,
  withSignerIfPossible = true,
  chainId,
}: {
  address?: string
  ABI: any
  withSignerIfPossible?: boolean
  chainId?: UniverseChainId
}): T | null {
  const account = useAccount()
  const provider = useEthersProvider({ chainId: chainId ?? account.chainId })

  return useMemo(() => {
    if (!address || !ABI || !provider) {
      return null
    }
    try {
      return getContract({
        address,
        ABI,
        provider,
        account: withSignerIfPossible && account.address ? account.address : undefined,
      })
    } catch (error) {
      const wrappedError = new Error('failed to get contract', { cause: error })
      logger.warn('useContract', 'useContract', wrappedError.message, {
        error: wrappedError,
        contractAddress: address,
        accountAddress: account.address,
      })
      return null
    }
  }, [address, ABI, provider, withSignerIfPossible, account.address]) as T
}

export function useV2MigratorContract() {
  const account = useAccount()
  return useContract<V3Migrator>({
    address: account.chainId ? V3_MIGRATOR_ADDRESSES[account.chainId] : undefined,
    ABI: V2MigratorABI,
  })
}

export function useTokenContract({
  tokenAddress,
  withSignerIfPossible = false,
  chainId,
}: {
  tokenAddress?: string
  withSignerIfPossible?: boolean
  chainId?: UniverseChainId
}) {
  return useContract<Erc20>({
    address: tokenAddress,
    ABI: ERC20_ABI,
    withSignerIfPossible,
    chainId,
  })
}

export function useWETHContract(withSignerIfPossible?: boolean, chainId?: UniverseChainId) {
  return useContract<Weth>({
    address: chainId ? WRAPPED_NATIVE_CURRENCY[chainId]?.address : undefined,
    ABI: WETH_ABI,
    withSignerIfPossible,
    chainId,
  })
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract({ address: pairAddress, ABI: IUniswapV2PairABI, withSignerIfPossible })
}

export function useInterfaceMulticall(chainId?: UniverseChainId) {
  const account = useAccount()
  const chain = chainId ?? account.chainId
  return useContract<UniswapInterfaceMulticall>({
    address: chain ? MULTICALL_ADDRESSES[chain] : undefined,
    ABI: MulticallABI,
    withSignerIfPossible: false,
    chainId: chain,
  }) as UniswapInterfaceMulticall
}

export function useV3NFTPositionManagerContract(
  withSignerIfPossible?: boolean,
  chainId?: UniverseChainId,
): NonfungiblePositionManager | null {
  const account = useAccount()
  const chainIdToUse = chainId ?? account.chainId
  const contract = useContract<NonfungiblePositionManager>({
    address: chainIdToUse ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainIdToUse] : undefined,
    ABI: NFTPositionManagerABI,
    withSignerIfPossible,
    chainId: chainIdToUse,
  })
  useEffect(() => {
    if (contract && account.isConnected) {
      sendAnalyticsEvent(InterfaceEventName.WalletProviderUsed, {
        source: 'useV3NFTPositionManagerContract',
        contract: {
          name: 'V3NonfungiblePositionManager',
          address: contract.address,
          withSignerIfPossible,
          chainId: chainIdToUse,
        },
      })
    }
  }, [account.isConnected, chainIdToUse, contract, withSignerIfPossible])
  return contract
}

/**
 * NOTE: the return type of this contract and the ABI used are just a generic ERC721,
 * so you can only use this to call tokenURI or other Position NFT related functions.
 */
export function useV4NFTPositionManagerContract(
  withSignerIfPossible?: boolean,
  chainId?: EVMUniverseChainId,
): Erc721 | null {
  const account = useAccount()
  const chainIdToUse = chainId ?? account.chainId

  const contract = useContract<Erc721>({
    address: chainIdToUse ? CHAIN_TO_ADDRESSES_MAP[chainIdToUse].v4PositionManagerAddress : undefined,
    ABI: NFTPositionManagerABI,
    withSignerIfPossible,
    chainId: chainIdToUse,
  })
  useEffect(() => {
    if (contract && account.isConnected) {
      sendAnalyticsEvent(InterfaceEventName.WalletProviderUsed, {
        source: 'useV4NFTPositionManagerContract',
        contract: {
          name: 'V4NonfungiblePositionManager',
          address: contract.address,
          withSignerIfPossible,
          chainId: chainIdToUse,
        },
      })
    }
  }, [account.isConnected, chainIdToUse, contract, withSignerIfPossible])
  return contract
}
