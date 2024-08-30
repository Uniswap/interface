import { Contract } from '@ethersproject/contracts'
import { InterfaceEventName } from '@ubeswap/analytics-events'
import {
  ARGENT_WALLET_DETECTOR_ADDRESS,
  ChainId,
  ENS_REGISTRAR_ADDRESSES,
  FARM_REGISTRY_ADDRESSES,
  MULTICALL_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  OLD_UBE_ROMULUS_ADDRESSES,
  UBE_ADDRESSES,
  UBE_CONVERT_ADDRESSES,
  V2_ROUTER_ADDRESSES,
  V3_MIGRATOR_ADDRESSES,
} from '@ubeswap/sdk-core'
import IUniswapV2PairJson from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import IUniswapV2Router02Json from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import V3_POOL_ABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import NonfungiblePositionManagerJson from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import V3MigratorJson from '@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import UniswapInterfaceMulticallJson from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import { RPC_PROVIDERS } from 'constants/providers'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useEffect, useMemo } from 'react'
import ARGENT_WALLET_DETECTOR_ABI from 'uniswap/src/abis/argent-wallet-detector.json'
import EIP_2612 from 'uniswap/src/abis/eip_2612.json'
import ENS_PUBLIC_RESOLVER_ABI from 'uniswap/src/abis/ens-public-resolver.json'
import ENS_ABI from 'uniswap/src/abis/ens-registrar.json'
import ERC1155_ABI from 'uniswap/src/abis/erc1155.json'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import ERC20_BYTES32_ABI from 'uniswap/src/abis/erc20_bytes32.json'
import ERC721_ABI from 'uniswap/src/abis/erc721.json'
import FARM_REGISTRY_ABI from 'uniswap/src/abis/farm-registry.json'
import MOOLA_STAKING_ABI from 'uniswap/src/abis/moola-staking-rewards.json'
import POOL_MANAGER_ABI from 'uniswap/src/abis/pool-manager.json'
import UBE_ROMULUS_ABI from 'uniswap/src/abis/romulus-delegate.json'
import STAKING_REWARDS_ABI from 'uniswap/src/abis/staking-rewards.json'
import {
  ArgentWalletDetector,
  EnsPublicResolver,
  EnsRegistrar,
  Erc1155,
  Erc20,
  Erc721,
  FarmRegistry,
  MoolaStakingRewards,
  PoolManager,
  RomulusDelegate,
  StakingRewards,
  UbeConvert,
  UbeToken,
  UbeswapV3Farming,
  Weth,
} from 'uniswap/src/abis/types'
import { NonfungiblePositionManager, UniswapInterfaceMulticall, UniswapV3Pool } from 'uniswap/src/abis/types/v3'
import { V3Migrator } from 'uniswap/src/abis/types/v3/V3Migrator'
import UBE_CONVERT_ABI from 'uniswap/src/abis/ube-convert.json'
import UBE_TOKEN_ABI from 'uniswap/src/abis/ube-token.json'
import UBESWAP_V3_FARMING_ABI from 'uniswap/src/abis/ubeswap-v3-farming.json'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getContract } from 'utilities/src/contracts/getContract'

const { abi: IUniswapV2PairABI } = IUniswapV2PairJson
const { abi: IUniswapV2Router02ABI } = IUniswapV2Router02Json
const { abi: MulticallABI } = UniswapInterfaceMulticallJson
const { abi: NFTPositionManagerABI } = NonfungiblePositionManagerJson
const { abi: V2MigratorABI } = V3MigratorJson

// returns null on errors
export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  withSignerIfPossible = true
): T | null {
  const { provider, account, chainId } = useWeb3React()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: string | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return getContract(address, ABI, provider, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [addressOrAddressMap, ABI, provider, chainId, withSignerIfPossible, account]) as T
}

function useMainnetContract<T extends Contract = Contract>(address: string | undefined, ABI: any): T | null {
  const { chainId } = useWeb3React()
  const isMainnet = chainId === ChainId.MAINNET
  const contract = useContract(isMainnet ? address : undefined, ABI, false)

  return useMemo(() => {
    if (isMainnet) return contract
    if (!address) return null
    const provider = RPC_PROVIDERS[ChainId.MAINNET]
    try {
      return getContract(address, ABI, provider)
    } catch (error) {
      console.error('Failed to get mainnet contract', error)
      return null
    }
  }, [isMainnet, contract, address, ABI]) as T
}

export function useV2MigratorContract() {
  return useContract<V3Migrator>(V3_MIGRATOR_ADDRESSES, V2MigratorABI, true)
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean) {
  return useContract<Erc20>(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean) {
  const { chainId } = useWeb3React()
  return useContract<Weth>(
    chainId ? WRAPPED_NATIVE_CURRENCY[chainId]?.address : undefined,
    WETH_ABI,
    withSignerIfPossible
  )
}

export function useERC721Contract(nftAddress?: string) {
  return useContract<Erc721>(nftAddress, ERC721_ABI, false)
}

export function useERC1155Contract(nftAddress?: string) {
  return useContract<Erc1155>(nftAddress, ERC1155_ABI, false)
}

export function useArgentWalletDetectorContract() {
  return useContract<ArgentWalletDetector>(ARGENT_WALLET_DETECTOR_ADDRESS, ARGENT_WALLET_DETECTOR_ABI, false)
}

export function useENSRegistrarContract() {
  return useMainnetContract<EnsRegistrar>(ENS_REGISTRAR_ADDRESSES[ChainId.MAINNET], ENS_ABI)
}

export function useENSResolverContract(address: string | undefined) {
  return useMainnetContract<EnsPublicResolver>(address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function useEIP2612Contract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress, EIP_2612, false)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useV2RouterContract(): Contract | null {
  const { chainId } = useWeb3React()
  return useContract(chainId ? V2_ROUTER_ADDRESSES[chainId] : undefined, IUniswapV2Router02ABI, true)
}

export function useInterfaceMulticall() {
  return useContract<UniswapInterfaceMulticall>(MULTICALL_ADDRESSES, MulticallABI, false) as UniswapInterfaceMulticall
}

export function useMainnetInterfaceMulticall() {
  return useMainnetContract<UniswapInterfaceMulticall>(
    MULTICALL_ADDRESSES[ChainId.MAINNET],
    MulticallABI
  ) as UniswapInterfaceMulticall
}

export function useV3NFTPositionManagerContract(withSignerIfPossible?: boolean): NonfungiblePositionManager | null {
  const { account, chainId } = useWeb3React()
  const contract = useContract<NonfungiblePositionManager>(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
    NFTPositionManagerABI,
    withSignerIfPossible
  )
  useEffect(() => {
    if (contract && account) {
      sendAnalyticsEvent(InterfaceEventName.WALLET_PROVIDER_USED, {
        source: 'useV3NFTPositionManagerContract',
        contract: {
          name: 'V3NonfungiblePositionManager',
          address: contract.address,
          withSignerIfPossible,
          chainId,
        },
      })
    }
  }, [account, chainId, contract, withSignerIfPossible])
  return contract
}

export function useUbeConvertContract() {
  return useContract<UbeConvert>(UBE_CONVERT_ADDRESSES, UBE_CONVERT_ABI, true)
}

export function usePactConvertContract() {
  return useContract<UbeConvert>('0x1854c78e5401A501A8F32f3a9DFae3d356Fb9A9E', UBE_CONVERT_ABI, true)
}

export function useUbeTokenContract() {
  return useContract<UbeToken>(UBE_ADDRESSES, UBE_TOKEN_ABI, true)
}

export function useRomulusDelegateContract() {
  return useContract<RomulusDelegate>(OLD_UBE_ROMULUS_ADDRESSES, UBE_ROMULUS_ABI, true)
}

export function useFarmRegistryContract() {
  return useContract<FarmRegistry>(FARM_REGISTRY_ADDRESSES, FARM_REGISTRY_ABI, true)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): StakingRewards | null {
  return useContract<StakingRewards>(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible)
}

export function useMoolaStakingRewardsContract(
  stakingAddress?: string,
  withSignerIfPossible?: boolean
): MoolaStakingRewards | null {
  return useContract<MoolaStakingRewards>(stakingAddress, MOOLA_STAKING_ABI, withSignerIfPossible)
}

export function usePoolManagerContract(address?: string, withSignerIfPossible?: boolean): PoolManager | null {
  return useContract<PoolManager>(address, POOL_MANAGER_ABI, withSignerIfPossible)
}

export function usePoolContract(address?: string) {
  return useContract<UniswapV3Pool>(address, V3_POOL_ABI.abi, true)
}

export function useUbeswapV3FarmingContract(address?: string) {
  return useContract<UbeswapV3Farming>(address, UBESWAP_V3_FARMING_ABI, true)
}
