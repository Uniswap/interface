import { AddressZero } from '@ethersproject/constants'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'

import CLAIM_REWARD_ABI from 'constants/abis/claim-reward.json'
import ROUTER_DYNAMIC_FEE_ABI from 'constants/abis/dmm-router-dynamic-fee.json'
import ROUTER_STATIC_FEE_ABI from 'constants/abis/dmm-router-static-fee.json'
import KS_ROUTER_STATIC_FEE_ABI from 'constants/abis/ks-router-static-fee.json'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { isAddress } from 'utils'

// account is not optional
function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(
  address: string,
  ABI: ContractInterface,
  library: Web3Provider,
  account?: string,
): Contract {
  if (!isAddress(ChainId.MAINNET, address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

export function getContractForReading(
  address: string,
  ABI: ContractInterface,
  library: ethers.providers.JsonRpcProvider,
): Contract {
  if (!isAddress(ChainId.MAINNET, address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, library)
}

// account is optional
export function getOldStaticFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(
    isEVM(chainId) ? NETWORKS_INFO[chainId].classic.oldStatic?.router ?? '' : '',
    ROUTER_STATIC_FEE_ABI,
    library,
    account,
  )
}
// account is optional
export function getStaticFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(
    isEVM(chainId) ? NETWORKS_INFO[chainId].classic.static.router : '',
    KS_ROUTER_STATIC_FEE_ABI,
    library,
    account,
  )
}
// account is optional
export function getDynamicFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(
    isEVM(chainId) ? NETWORKS_INFO[chainId].classic.dynamic?.router ?? '' : '',
    ROUTER_DYNAMIC_FEE_ABI,
    library,
    account,
  )
}

// account is optional
export function getZapContract(
  chainId: ChainId,
  library: Web3Provider,
  account?: string,
  isStaticFeeContract?: boolean,
  isOldStaticFeeContract?: boolean,
): Contract {
  return getContract(
    isEVM(chainId)
      ? isStaticFeeContract
        ? isOldStaticFeeContract
          ? NETWORKS_INFO[chainId].classic.oldStatic?.zap || ''
          : NETWORKS_INFO[chainId].classic.static.zap
        : NETWORKS_INFO[chainId].classic.dynamic?.zap || ''
      : '',
    isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI,
    library,
    account,
  )
}

export function getClaimRewardContract(
  chainId: ChainId,
  library: Web3Provider,
  account?: string,
): Contract | undefined {
  if (!isEVM(chainId)) return
  const claimReward = NETWORKS_INFO[chainId].classic.claimReward
  if (!claimReward) return
  return getContract(claimReward, CLAIM_REWARD_ABI, library, account)
}
