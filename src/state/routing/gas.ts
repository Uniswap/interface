import { MaxUint256, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { Currency } from '@uniswap/sdk-core'
import ERC20_ABI from 'abis/erc20.json'
import { Erc20, Weth } from 'abis/types'
import WETH_ABI from 'abis/weth.json'
import { SupportedInterfaceChain } from 'constants/chains'
import { DEPRECATED_RPC_PROVIDERS } from 'constants/providers'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { getContract } from 'utils'

import { ApproveInfo, WrapInfo } from './types'

// TODO(UniswapX): add fallback gas limits per chain? l2s have higher costs
const WRAP_FALLBACK_GAS_LIMIT = 45_000
const APPROVE_FALLBACK_GAS_LIMIT = 65_000

export async function getApproveInfo(
  account: string | undefined,
  currency: Currency,
  amount: string,
  usdCostPerGas?: number
): Promise<ApproveInfo> {
  // native currencies do not need token approvals
  if (currency.isNative) return { needsApprove: false }

  // If any of these arguments aren't provided, then we cannot generate approval cost info
  if (!account || !usdCostPerGas) return { needsApprove: false }

  const provider = DEPRECATED_RPC_PROVIDERS[currency.chainId as SupportedInterfaceChain]
  const tokenContract = getContract(currency.address, ERC20_ABI, provider) as Erc20

  let approveGasUseEstimate
  try {
    const allowance = await tokenContract.callStatic.allowance(account, PERMIT2_ADDRESS)
    if (!allowance.lt(amount)) return { needsApprove: false }
  } catch (_) {
    // If contract lookup fails (eg if Infura goes down), then don't show gas info for approving the token
    return { needsApprove: false }
  }

  try {
    const approveTx = await tokenContract.populateTransaction.approve(PERMIT2_ADDRESS, MaxUint256)
    approveGasUseEstimate = (await provider.estimateGas({ from: account, ...approveTx })).toNumber()
  } catch (_) {
    // estimateGas will error if the account doesn't have sufficient token balance, but we should show an estimated cost anyway
    approveGasUseEstimate = APPROVE_FALLBACK_GAS_LIMIT
  }

  return { needsApprove: true, approveGasEstimateUSD: approveGasUseEstimate * usdCostPerGas }
}

export async function getWrapInfo(
  needsWrap: boolean,
  account: string | undefined,
  chainId: SupportedInterfaceChain,
  amount: string,
  usdCostPerGas?: number
): Promise<WrapInfo> {
  if (!needsWrap) return { needsWrap: false }

  const provider = DEPRECATED_RPC_PROVIDERS[chainId]
  const wethAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address

  // If any of these arguments aren't provided, then we cannot generate wrap cost info
  if (!wethAddress || !usdCostPerGas) return { needsWrap: false }
  let wrapGasUseEstimate
  try {
    const wethContract = getContract(wethAddress, WETH_ABI, provider, account) as Weth
    const wethTx = await wethContract.populateTransaction.deposit({ value: amount })

    // estimateGas will error if the account doesn't have sufficient ETH balance, but we should show an estimated cost anyway
    wrapGasUseEstimate = (await provider.estimateGas({ from: account, ...wethTx })).toNumber()
  } catch (_) {
    wrapGasUseEstimate = WRAP_FALLBACK_GAS_LIMIT
  }

  return { needsWrap: true, wrapGasEstimateUSD: wrapGasUseEstimate * usdCostPerGas }
}
