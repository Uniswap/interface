import { Contract } from '@ethersproject/contracts'
import {
  ChainId,
  Token,
  Currency,
  WETH,
  MULTICALL_ABI,
  MULTICALL_ADDRESS,
  WXDAI,
  STAKING_REWARDS_FACTORY_ADDRESS,
  STAKING_REWARDS_FACTORY_ABI,
  STAKING_REWARDS_DISTRIBUTION_ABI,
  SWPR_CLAIMER_ABI,
  SWPR_CLAIMER_ADDRESS
} from '@swapr/sdk'
import SWPR_CONVERTER_ABI from '../constants/abis/swpr-converter.json'
import { abi as IDXswapPairABI } from '@swapr/core/build/IDXswapPair.json'
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
import WXDAI_ABI from '../constants/abis/wxdai.json'
import { getContract, getProviderOrSigner, isAddress } from '../utils'
import { useActiveWeb3React } from './index'
import { useNativeCurrency } from './useNativeCurrency'
import { ARBITRUM_RINKEBY_PROVIDER } from '../constants'
import { CONVERTER_ADDRESS } from '../constants/converter'
import { constants } from 'ethers'

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
  const { chainId } = useActiveWeb3React()
  if (!chainId || !currency || !Currency.isNative(currency)) return undefined
  return Token.getNativeWrapper(chainId)
}

function useWrappingTokenAbi(token?: Token): any | undefined {
  const { chainId } = useActiveWeb3React()
  if (!chainId) return undefined
  switch (token) {
    case WETH[chainId]:
      return WETH_ABI
    case WXDAI[chainId]:
      return WXDAI_ABI
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
  return useContract(chainId && MULTICALL_ADDRESS[chainId], MULTICALL_ABI, false)
}

export function useStakingRewardsDistributionFactoryContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId && STAKING_REWARDS_FACTORY_ADDRESS[chainId],
    STAKING_REWARDS_FACTORY_ABI,
    withSignerIfPossible
  )
}

export function useStakingRewardsDistributionContract(
  address?: string,
  withSignerIfPossible?: boolean
): Contract | null {
  return useContract(address, STAKING_REWARDS_DISTRIBUTION_ABI, withSignerIfPossible)
}

export function useSWPRClaimerContract(): Contract | null {
  const { library, chainId, account } = useActiveWeb3React()
  return useMemo(() => {
    const address = SWPR_CLAIMER_ADDRESS[ChainId.ARBITRUM_RINKEBY] // TODO: change to Arb1
    const ABI = SWPR_CLAIMER_ABI
    if (!address || !isAddress(address) || address === constants.AddressZero || !ABI || !library) return null
    try {
      return new Contract(
        address,
        ABI,
        account
          ? (getProviderOrSigner(
              chainId === ChainId.ARBITRUM_RINKEBY ? library : ARBITRUM_RINKEBY_PROVIDER,
              account
            ) as any) // TODO: change to Arb1
          : account
      )
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [library, chainId, account])
}

export function useSWPRConverterContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  const address = useMemo(() => (chainId ? CONVERTER_ADDRESS[chainId] : undefined), [chainId])
  return useContract(address, SWPR_CONVERTER_ABI, withSignerIfPossible)
}
