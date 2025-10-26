import { MaxUint256, permit2Address } from '@uniswap/permit2-sdk'
import { Currency } from '@uniswap/sdk-core'
import { RPC_PROVIDERS } from 'constants/providers'
import { ApproveInfo, WrapInfo } from 'state/routing/types'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20, Weth } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { WRAP_FALLBACK_GAS_LIMIT_IN_GWEI } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { getContract } from 'utilities/src/contracts/getContract'

// TODO(UniswapX): add fallback gas limits per chain? l2s have higher costs
const APPROVE_FALLBACK_GAS_LIMIT_IN_GWEI = 65_000

export async function getApproveInfo({
  account,
  currency,
  amount,
  usdCostPerGas,
}: {
  account?: string
  currency: Currency & { chainId: EVMUniverseChainId }
  amount: string
  usdCostPerGas?: number
}): Promise<ApproveInfo> {
  // native currencies do not need token approvals
  if (currency.isNative) {
    return { needsApprove: false }
  }

  // If any of these arguments aren't provided, then we cannot generate approval cost info
  if (!account || !usdCostPerGas) {
    return { needsApprove: false }
  }

  // routing-api under estimates gas for Arbitrum swaps so it inflates cost per gas by a lot
  // so disable showing approves for Arbitrum until routing-api gives more accurate gas estimates
  if (currency.chainId === UniverseChainId.ArbitrumOne) {
    return { needsApprove: false }
  }

  const provider = RPC_PROVIDERS[currency.chainId]
  const tokenContract = getContract({ address: currency.address, ABI: ERC20_ABI, provider }) as Erc20

  let approveGasUseEstimate
  try {
    const allowance = await tokenContract.callStatic.allowance(account, permit2Address(currency.chainId))
    if (allowance.gte(amount)) {
      return { needsApprove: false }
    }
  } catch {
    // If contract lookup fails (eg if Infura goes down), then don't show gas info for approving the token
    return { needsApprove: false }
  }

  try {
    const approveTx = await tokenContract.populateTransaction.approve(permit2Address(currency.chainId), MaxUint256)
    approveGasUseEstimate = (await provider.estimateGas({ from: account, ...approveTx })).toNumber()
  } catch {
    // estimateGas will error if the account doesn't have sufficient token balance, but we should show an estimated cost anyway
    approveGasUseEstimate = APPROVE_FALLBACK_GAS_LIMIT_IN_GWEI
  }

  return { needsApprove: true, approveGasEstimateUSD: approveGasUseEstimate * usdCostPerGas }
}

export async function getWrapInfo({
  needsWrap,
  account,
  chainId,
  amount,
  usdCostPerGas,
}: {
  needsWrap: boolean
  account?: string
  chainId: EVMUniverseChainId
  amount: string
  usdCostPerGas?: number
}): Promise<WrapInfo> {
  if (!needsWrap) {
    return { needsWrap: false }
  }

  const provider = RPC_PROVIDERS[chainId]
  const wethAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address

  // If any of these arguments aren't provided, then we cannot generate wrap cost info
  if (!wethAddress || !usdCostPerGas) {
    return { needsWrap: false }
  }
  let wrapGasUseEstimate
  try {
    const wethContract = getContract({ address: wethAddress, ABI: WETH_ABI, provider, account }) as Weth
    const wethTx = await wethContract.populateTransaction.deposit({ value: amount })

    // estimateGas will error if the account doesn't have sufficient ETH balance, but we should show an estimated cost anyway
    wrapGasUseEstimate = (await provider.estimateGas({ from: account, ...wethTx })).toNumber()
  } catch {
    wrapGasUseEstimate = WRAP_FALLBACK_GAS_LIMIT_IN_GWEI
  }

  return { needsWrap: true, wrapGasEstimateUSD: wrapGasUseEstimate * usdCostPerGas }
}
