import { Contract } from '@ethersproject/contracts'
import IPegasysPairJson from '@pollum-io/pegasys-protocol/artifacts/contracts/pegasys-core/interfaces/IPegasysPair.sol/IPegasysPair.json'
import IPegasysRouterJson from '@pollum-io/pegasys-protocol/artifacts/contracts/pegasys-periphery/interfaces/IPegasysRouter.sol/IPegasysRouter.json'
import QuoterV2Json from '@pollum-io/swap-router-contracts/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import PegasysInterfaceMulticallJson from '@pollum-io/v3-periphery/artifacts/contracts/lens/PegasysInterfaceMulticall.sol/PegasysInterfaceMulticall.json'
import QuoterJson from '@pollum-io/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import TickLensJson from '@pollum-io/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json'
import NonfungiblePositionManagerJson from '@pollum-io/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import V3MigratorJson from '@pollum-io/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import { useWeb3React } from '@web3-react/core'
import ARGENT_WALLET_DETECTOR_ABI from 'abis/argent-wallet-detector.json'
import EIP_2612 from 'abis/eip_2612.json'
import ENS_PUBLIC_RESOLVER_ABI from 'abis/ens-public-resolver.json'
import ENS_ABI from 'abis/ens-registrar.json'
import ERC20_ABI from 'abis/erc20.json'
import ERC20_BYTES32_ABI from 'abis/erc20_bytes32.json'
import ERC721_ABI from 'abis/erc721.json'
import ERC1155_ABI from 'abis/erc1155.json'
import { ArgentWalletDetector, EnsPublicResolver, EnsRegistrar, Erc20, Erc721, Erc1155, Weth } from 'abis/types'
import WETH_ABI from 'abis/weth.json'
import {
  ARGENT_WALLET_DETECTOR_ADDRESS,
  ENS_REGISTRAR_ADDRESSES,
  GAMMA_MASTERCHEF_ADDRESSES,
  MULTICALL_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  QUOTER_ADDRESSES,
  TICK_LENS_ADDRESSES,
  V2_ROUTER_ADDRESS,
  V3_MIGRATOR_ADDRESSES,
} from 'constants/addresses'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useMemo } from 'react'
import { NonfungiblePositionManager, PegasysInterfaceMulticall, Quoter, QuoterV2, TickLens } from 'types/v3'
import { V3Migrator } from 'types/v3/V3Migrator'

import GammaPairABI from '../abis/gamma-hypervisor.json'
import GammaMasterChef from '../abis/gamma-masterchef.json'
import { getContract } from '../utils'

const { abi: IUniswapV2PairABI } = IPegasysPairJson
const { abi: IUniswapV2Router02ABI } = IPegasysRouterJson
const { abi: QuoterABI } = QuoterJson
const { abi: QuoterV2ABI } = QuoterV2Json
const { abi: TickLensABI } = TickLensJson
const { abi: MulticallABI } = PegasysInterfaceMulticallJson
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

function useContracts<T extends Contract = Contract>(
  addressOrAddressMaps: string[] | { [chainId: number]: string }[] | undefined,
  ABI: any,
  withSignerIfPossible = true
): (T | null)[] {
  const { provider, account, chainId } = useWeb3React()

  return useMemo(() => {
    if (!addressOrAddressMaps || !ABI || !provider || !chainId) return []
    return addressOrAddressMaps.map((addressOrAddressMap) => {
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
    })
  }, [addressOrAddressMaps, ABI, provider, chainId, withSignerIfPossible, account]) as (T | null)[]
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

export function useENSRegistrarContract(withSignerIfPossible?: boolean) {
  return useContract<EnsRegistrar>(ENS_REGISTRAR_ADDRESSES, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean) {
  return useContract<EnsPublicResolver>(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
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
  return useContract(V2_ROUTER_ADDRESS, IUniswapV2Router02ABI, true)
}

export function useInterfaceMulticall() {
  return useContract<PegasysInterfaceMulticall>(MULTICALL_ADDRESS, MulticallABI, false) as PegasysInterfaceMulticall
}

export function useV3NFTPositionManagerContract(withSignerIfPossible?: boolean): NonfungiblePositionManager | null {
  return useContract<NonfungiblePositionManager>(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
    NFTPositionManagerABI,
    withSignerIfPossible
  )
}

export function useQuoter(useQuoterV2: boolean) {
  return useContract<Quoter | QuoterV2>(QUOTER_ADDRESSES, useQuoterV2 ? QuoterV2ABI : QuoterABI)
}

export function useTickLens(): TickLens | null {
  const { chainId } = useWeb3React()
  const address = chainId ? TICK_LENS_ADDRESSES[chainId] : undefined
  return useContract(address, TickLensABI) as TickLens | null
}

export function useMasterChefContract(index?: number, withSignerIfPossible?: boolean, abi?: any) {
  return useContract(GAMMA_MASTERCHEF_ADDRESSES[index ?? 0], abi ?? GammaMasterChef, withSignerIfPossible)
}

export function useMasterChefContracts(withSignerIfPossible?: boolean) {
  return useContracts(Object.values(GAMMA_MASTERCHEF_ADDRESSES), GammaMasterChef, withSignerIfPossible)
}

export function useGammaHypervisorContract(address?: string, withSignerIfPossible?: boolean) {
  return useContract(address, GammaPairABI, withSignerIfPossible)
}
