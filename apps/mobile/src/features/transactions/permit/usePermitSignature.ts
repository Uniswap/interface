import { splitSignature } from '@ethersproject/bytes'
import { MaxUint256 } from '@ethersproject/constants'
import { BigintIsh, Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { BigNumber, Contract, providers } from 'ethers'
import { useCallback } from 'react'
import EIP_2612 from 'src/abis/eip_2612.json'
import { useProvider, useWalletSigners } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { PERMITTABLE_TOKENS, PermitType } from 'src/features/transactions/permit/permittableTokens'
import { ApprovalAction } from 'src/features/transactions/swap/hooks'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { Account } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { signTypedData } from 'src/features/wallet/signing/signing'
import { areAddressesEqual } from 'src/utils/addresses'
import { useAsyncData } from 'src/utils/hooks'
import { logger } from 'src/utils/logger'
import { inXMinutesUnix } from 'src/utils/time'

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
}

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
  chainId: ChainId,
  currencyInAmount: NullUndefined<CurrencyAmount<Currency>>,
  wrapType: WrapType,
  approvalAction?: ApprovalAction
): {
  isLoading: boolean
  data: PermitOptions | null | undefined
} {
  const provider = useProvider(chainId)
  const signerManager = useWalletSigners()
  const account = useActiveAccountWithThrow()
  const currencyIn = currencyInAmount?.currency

  const permitFetcher = useCallback(() => {
    // permit signature not needed
    if (approvalAction !== ApprovalAction.Permit) return
    // is a wrap or unwrap, skip getting signature
    if (wrapType !== WrapType.NotApplicable) return
    // no approvals/permits necessary for native token usage
    if (!currencyIn || currencyIn.isNative) return
    if (!provider) return

    const params: PermitTokenParams = {
      account,
      chainId,
      tokenAddress: currencyIn.address,
      spender: SWAP_ROUTER_ADDRESSES[chainId],
      txAmount: currencyInAmount.quotient.toString(),
    }

    return getPermitSignature(provider, signerManager, params)
  }, [
    account,
    approvalAction,
    chainId,
    currencyIn,
    currencyInAmount?.quotient,
    provider,
    signerManager,
    wrapType,
  ])

  return useAsyncData(permitFetcher)
}

async function getPermitSignature(
  provider: providers.Provider,
  signerManager: SignerManager,
  params: PermitTokenParams
): Promise<PermitOptions | null> {
  const { account, chainId, tokenAddress, spender } = params
  const { address } = account
  const permittableTokens = PERMITTABLE_TOKENS[chainId]

  if (!permittableTokens) {
    logger.debug(
      'usePermitSignature',
      'getPermitSignature',
      'No permittable tokens on the given chain'
    )
    return null
  }

  const permitInfo = Object.entries(permittableTokens).filter(([permittableAddress]) =>
    areAddressesEqual(tokenAddress, permittableAddress)
  )[0]?.[1]

  if (!permitInfo) {
    logger.debug('usePermitSignature', 'getPermitSignature', 'Permit not needed or not possible')
    return null
  }

  // Need to instantiate the contract directly because ContractManager
  // pulls the cached ERC20 contract, which we don't want here
  const contract = new Contract(tokenAddress, EIP_2612, provider)
  const nonce = ((await contract.nonces(address)) as BigNumber).toNumber()
  const allowed = permitInfo.type === PermitType.ALLOWED
  const value = MaxUint256.toString()
  const deadline = inXMinutesUnix(PERMIT_VALIDITY_TIME)

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

  const permitTypes = {
    Permit: allowed ? PERMIT_ALLOWED_TYPE : EIP2612_TYPE,
  }

  const signature = await signTypedData(domain, permitTypes, message, account, signerManager)
  const signatureData = splitSignature(signature)
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
