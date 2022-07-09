import { splitSignature } from '@ethersproject/bytes'
import { MaxUint256 } from '@ethersproject/constants'
import { BigintIsh } from '@uniswap/sdk-core'
import { BigNumber, Contract } from 'ethers'
import EIP_2612 from 'src/abis/eip_2612.json'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { PERMITTABLE_TOKENS, PermitType } from 'src/features/transactions/approve/permittableTokens'
import { selectAccounts } from 'src/features/wallet/selectors'
import { signTypedData } from 'src/features/walletConnect/saga'
import { logger } from 'src/utils/logger'
import { call, select } from 'typed-redux-saga'

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

export interface PermitSagaParams {
  address: Address
  chainId: ChainId
  tokenAddress: string
  spender: Address
  txAmount: string
  allowance: BigNumber
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

export function* signPermitMessage(params: PermitSagaParams) {
  const { address, chainId, tokenAddress, spender, allowance, txAmount } = params
  const permitInfo = PERMITTABLE_TOKENS[chainId]?.[tokenAddress]

  if (allowance.gt(txAmount) || !permitInfo) {
    logger.info('permitSaga', 'signPermitMessage', 'Permit not needed or not possible')
    return
  }

  const account = (yield* select(selectAccounts))?.[address]
  if (!account) {
    throw new Error(`No account associated with address: ${address}. This should never happen`)
  }

  const provider = yield* call(getProvider, chainId)
  // Need to instantiate the contract directly because ContractManager
  // pulls the cached ERC20 contract, which we don't want here
  const contract = new Contract(tokenAddress, EIP_2612, provider)
  const nonce = ((yield* call(contract.nonces, address)) as BigNumber).toNumber()
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

  const signerManager = yield* call(getSignerManager)
  const signature = yield* call(signTypedData, data, account, signerManager)
  const signatureData = yield* call(splitSignature, signature)
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
