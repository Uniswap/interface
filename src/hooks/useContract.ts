import { Contract } from '@ethersproject/contracts'
import { ChainId, Token, Currency, ETHER, WETH, SPOA, WSPOA } from 'dxswap-sdk'
import { abi as IDXswapPairABI } from 'dxswap-core/build/IDXswapPair.json'
import { useMemo } from 'react'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS
} from '../constants/abis/argent-wallet-detector'
import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ENS_ABI from '../constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import ERC20_ABI from '../constants/abis/erc20.json'
import WETH_ABI from '../constants/abis/weth.json'
import WSPOA_ABI from '../constants/abis/wspoa.json'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../constants/multicall'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'
import { useNativeCurrency } from './useNativeCurrency'
import { useWeb3React } from '@web3-react/core'

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWrappingToken(currency?: Currency): Token | undefined {
  const { chainId } = useWeb3React()
  if (!chainId || !currency || !currency.isNative()) return undefined
  switch (currency) {
    case ETHER:
      return WETH[chainId]
    case SPOA:
      return WSPOA[chainId]
    default:
      return undefined
  }
}

function useWrappingTokenAbi(token?: Token): any | undefined {
  const { chainId } = useWeb3React()
  if (!chainId) return undefined
  switch (token) {
    case WETH[chainId]:
      return WETH_ABI
    case WSPOA[chainId]:
      return WSPOA_ABI
    default:
      return undefined
  }
}

export function useNativeCurrencyWrapperContract(withSignerIfPossible?: boolean): Contract | null {
  const nativeCurrency = useNativeCurrency()
  const wrapperToken = useWrappingToken(nativeCurrency)
  const wrapperAbi = useWrappingTokenAbi(wrapperToken)
  return useContract(wrapperToken?.address, wrapperAbi, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined
  if (chainId) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.RINKEBY:
        address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
        break
    }
  }
  return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IDXswapPairABI, withSignerIfPossible)
}

export function useMulticallContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MULTICALL_NETWORKS[chainId], MULTICALL_ABI, false)
}
