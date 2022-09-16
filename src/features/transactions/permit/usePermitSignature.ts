import { splitSignature } from '@ethersproject/bytes'
import { MaxUint256 } from '@ethersproject/constants'
import { BigintIsh } from '@uniswap/sdk-core'
import { BigNumber, Contract, providers } from 'ethers'
import { useCallback } from 'react'
import EIP_2612 from 'src/abis/eip_2612.json'
import { useProvider, useWalletSigners } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { PERMITTABLE_TOKENS, PermitType } from 'src/features/transactions/permit/permittableTokens'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { signTypedData } from 'src/features/walletConnect/saga'
import { useAsyncData } from 'src/utils/hooks'
import { logger } from 'src/utils/logger'

const PERMIT_VALIDITY_TIME = 20 * 60 // 20 mins

interface BasePermitArguments {
  v: 0 | 1 | 27 | 28
  r: string
  s: string
}

interface StandardPermitArguments extends BasePermitArguments {
  amount: BigintIsh
  deadline: BigintIsh
}

interface AllowedPermitArguments extends BasePermitArguments {
  nonce: BigintIsh
  expiry: BigintIsh
}

export type PermitOptions = StandardPermitArguments | AllowedPermitArguments

export interface PermitTokenParams {
  account: Account
  chainId: ChainId
  tokenAddress: string
  spender: Address
  txAmount: string
  allowance: string | null
}

const EIP712_DOMAIN_TYPE_NO_VERSION = [
  { name: 'name', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

const EIP2612_TYPE = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
]

const PERMIT_ALLOWED_TYPE = [
  { name: 'holder', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
  { name: 'allowed', type: 'bool' },
]

export function usePermitSignature(
  derivedSwapInfo: DerivedSwapInfo,
  tokenAllowance?: string | null
) {
  const {
    chainId,
    currencies,
    trade: { trade },
    wrapType,
  } = derivedSwapInfo
  const provider = useProvider(chainId)
  const signerManager = useWalletSigners()
  const account = useActiveAccountWithThrow()
  const currencyIn = currencies[CurrencyField.INPUT]

  const permitFetcher = useCallback(() => {
    // is a wrap or unwrap, skip getting signature
    if (wrapType !== WrapType.NotApplicable) return
    // no approvals/permits necessary for native token usage
    if (!currencyIn || currencyIn.isNative) return
    // other tx details are still loading
    if (!provider || !tokenAllowance || !trade?.quote) return

    const params: PermitTokenParams = {
      account,
      chainId,
      tokenAddress: currencyIn.address,
      spender: SWAP_ROUTER_ADDRESSES[chainId],
      txAmount: trade.quote.amount,
      allowance: tokenAllowance,
    }

    return getPermitSignature(provider, signerManager, params)
  }, [
    account,
    chainId,
    currencyIn,
    provider,
    signerManager,
    tokenAllowance,
    trade?.quote,
    wrapType,
  ])

  return useAsyncData(permitFetcher)
}

async function getPermitSignature(
  provider: providers.Provider,
  signerManager: SignerManager,
  params: PermitTokenParams
) {
  const { account, chainId, tokenAddress, spender, allowance, txAmount } = params
  const { address } = account
  const permitInfo = PERMITTABLE_TOKENS[chainId]?.[tokenAddress]

  if (!allowance) return null
  if (!permitInfo || BigNumber.from(allowance).gt(txAmount)) {
    logger.info('permitSaga', 'signPermitMessage', 'Permit not needed or not possible')
    return null
  }

  // Need to instantiate the contract directly because ContractManager
  // pulls the cached ERC20 contract, which we don't want here
  const contract = new Contract(tokenAddress, EIP_2612, provider)
  const nonce = ((await contract.nonces(address)) as BigNumber).toNumber()
  const allowed = permitInfo.type === PermitType.ALLOWED
  const value = MaxUint256.toString()
  const deadline = Math.round(Date.now() / 1000) + PERMIT_VALIDITY_TIME

  const message = allowed
    ? {
        holder: address,
        spender,
        allowed,
        nonce,
        expiry: deadline,
      }
    : {
        owner: address,
        spender,
        value,
        nonce,
        deadline,
      }

  const domain = permitInfo.version
    ? {
        name: permitInfo.name,
        version: permitInfo.version,
        verifyingContract: tokenAddress,
        chainId,
      }
    : {
        name: permitInfo.name,
        verifyingContract: tokenAddress,
        chainId,
      }

  const data = JSON.stringify({
    types: {
      EIP712Domain: permitInfo.version ? EIP712_DOMAIN_TYPE : EIP712_DOMAIN_TYPE_NO_VERSION,
      Permit: allowed ? PERMIT_ALLOWED_TYPE : EIP2612_TYPE,
    },
    domain,
    primaryType: 'Permit',
    message,
  })

  const signature = await signTypedData(data, account, signerManager)
  const signatureData = await splitSignature(signature)
  const v = signatureData.v as 0 | 1 | 27 | 28
  const permitOptions: PermitOptions = allowed
    ? {
        expiry: deadline,
        nonce,
        s: signatureData.s,
        r: signatureData.r,
        v,
      }
    : {
        deadline,
        amount: value,
        s: signatureData.s,
        r: signatureData.r,
        v,
      }

  return permitOptions
}
