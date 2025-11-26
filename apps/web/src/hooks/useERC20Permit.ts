import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import JSBI from 'jsbi'
import { useMemo, useState } from 'react'
import { EIP2612_ABI } from 'uniswap/src/abis/eip_2612'
import { DAI, UNI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract } from 'wagmi'

export enum PermitType {
  AMOUNT = 1,
  ALLOWED = 2,
}

// 20 minutes to submit after signing
const PERMIT_VALIDITY_BUFFER = 20 * 60

export interface PermitInfo {
  type: PermitType
  name: string
  // version is optional, and if omitted, will not be included in the domain
  version?: string
}

// todo: read this information from extensions on token lists or elsewhere (permit registry?)
const PERMITTABLE_TOKENS: {
  [chainId: number]: {
    [checksummedTokenAddress: string]: PermitInfo
  }
} = {
  [UniverseChainId.Mainnet]: {
    [USDC_MAINNET.address]: { type: PermitType.AMOUNT, name: 'USD Coin', version: '2' },
    [DAI.address]: { type: PermitType.ALLOWED, name: 'Dai Stablecoin', version: '1' },
    [UNI[UniverseChainId.Mainnet].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
  [UniverseChainId.Sepolia]: {
    [UNI[UniverseChainId.Sepolia].address]: { type: PermitType.AMOUNT, name: 'Uniswap' },
  },
}

enum UseERC20PermitState {
  // returned for any reason, e.g. it is an argent wallet, or the currency does not support it
  NOT_APPLICABLE = 0,
  LOADING = 1,
  NOT_SIGNED = 2,
  SIGNED = 3,
}

interface BaseSignatureData {
  v: number
  r: string
  s: string
  deadline: number
  nonce: number
  owner: string
  spender: string
  chainId: number
  tokenAddress: string
  permitType: PermitType
}

interface StandardSignatureData extends BaseSignatureData {
  amount: string
}

interface AllowedSignatureData extends BaseSignatureData {
  allowed: true
}

type SignatureData = StandardSignatureData | AllowedSignatureData

export type ERC20PermitReturnType = {
  signatureData: SignatureData | null
  state: UseERC20PermitState
  gatherPermitSignature: null | (() => Promise<void>)
}

const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

const EIP712_DOMAIN_TYPE_NO_VERSION = [
  { name: 'name', type: 'string' },
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

export function useERC20Permit({
  currencyAmount,
  spender,
  transactionDeadline,
  overridePermitInfo,
}: {
  currencyAmount?: CurrencyAmount<Currency> | null
  spender?: string | null
  transactionDeadline?: BigNumber
  overridePermitInfo?: PermitInfo | null
}): ERC20PermitReturnType {
  const account = useAccount()
  const provider = useEthersWeb3Provider()
  const tokenAddress = currencyAmount?.currency.isToken ? currencyAmount.currency.address : undefined
  const isArgentWallet = useIsArgentWallet()

  const { data: nonce, isLoading: nonceLoading } = useReadContract({
    address: assume0xAddress(tokenAddress),
    chainId: currencyAmount?.currency.chainId,
    abi: EIP2612_ABI,
    functionName: 'nonces',
    args: account.address ? [assume0xAddress(account.address)] : undefined,
    query: { enabled: !!account.address },
  })

  const permitInfo =
    overridePermitInfo ??
    (account.isConnected && account.chainId && tokenAddress
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        PERMITTABLE_TOKENS[account.chainId]?.[tokenAddress]
      : undefined)

  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)

  return useMemo(() => {
    if (
      isArgentWallet ||
      !currencyAmount ||
      !account.chainId ||
      !account.address ||
      !transactionDeadline ||
      !provider ||
      nonce === undefined ||
      !tokenAddress ||
      !spender ||
      !permitInfo
    ) {
      return {
        state: UseERC20PermitState.NOT_APPLICABLE,
        signatureData: null,
        gatherPermitSignature: null,
      }
    }

    const nonceNumber = Number(nonce)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (nonceLoading || typeof nonceNumber !== 'number') {
      return {
        state: UseERC20PermitState.LOADING,
        signatureData: null,
        gatherPermitSignature: null,
      }
    }

    const isSignatureDataValid =
      signatureData &&
      signatureData.owner === account.address &&
      signatureData.deadline >= transactionDeadline.toNumber() &&
      signatureData.tokenAddress === tokenAddress &&
      signatureData.nonce === nonceNumber &&
      signatureData.spender === spender &&
      ('allowed' in signatureData ||
        JSBI.greaterThanOrEqual(JSBI.BigInt(signatureData.amount), currencyAmount.quotient))

    return {
      state: isSignatureDataValid ? UseERC20PermitState.SIGNED : UseERC20PermitState.NOT_SIGNED,
      signatureData: isSignatureDataValid ? signatureData : null,
      gatherPermitSignature: async function gatherPermitSignature() {
        const allowed = permitInfo.type === PermitType.ALLOWED
        const signatureDeadline = transactionDeadline.toNumber() + PERMIT_VALIDITY_BUFFER
        const value = currencyAmount.quotient.toString()

        const message = allowed
          ? {
              holder: account.address,
              spender,
              allowed,
              nonce: nonceNumber,
              expiry: signatureDeadline,
            }
          : {
              owner: account.address,
              spender,
              value,
              nonce: nonceNumber,
              deadline: signatureDeadline,
            }
        const domain = permitInfo.version
          ? {
              name: permitInfo.name,
              version: permitInfo.version,
              verifyingContract: tokenAddress,
              chainId: account.chainId,
            }
          : {
              name: permitInfo.name,
              verifyingContract: tokenAddress,
              chainId: account.chainId,
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

        return provider
          .send('eth_signTypedData_v4', [account.address, data])
          .then(splitSignature)
          .then((signature) => {
            setSignatureData({
              v: signature.v,
              r: signature.r,
              s: signature.s,
              deadline: signatureDeadline,
              ...(allowed ? { allowed } : { amount: value }),
              nonce: nonceNumber,
              chainId: account.chainId as UniverseChainId,
              owner: account.address as string,
              spender,
              tokenAddress,
              permitType: permitInfo.type,
            })
          })
      },
    }
  }, [
    isArgentWallet,
    currencyAmount,
    account.chainId,
    account.address,
    transactionDeadline,
    provider,
    nonce,
    nonceLoading,
    tokenAddress,
    spender,
    permitInfo,
    signatureData,
  ])
}
