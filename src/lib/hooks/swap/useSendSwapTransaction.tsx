import { BigNumber } from '@ethersproject/bignumber'
import { Signature, splitSignature } from '@ethersproject/bytes'
import { NonceManager } from '@ethersproject/experimental'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { domain, DOMAIN_TYPE, SWAP_TYPE } from 'constants/eip712'
import { solidityKeccak256 } from 'ethers/lib/utils'
import { SwapCall } from 'hooks/useSwapCallArguments'
import { useMemo } from 'react'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface EncryptResponse {
  message_length: number
  cipher_text: string
  proof: string
}

interface VdfResponse {
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  vdf_snark_proof: string
  s2_string: string
  s2_field_hex: string
  commitment_hex: string
}

interface EncryptedTx {
  txOwner: string
  amountIn: string
  amountOutMin: string
  path: Path
  to: string
  deadline: number
  txId: string
}

interface Path {
  message_length: number
  nonce: string
  commitment: string
  cipher_text: string[]
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  vdf_snark_proof: string
  encryption_proof: string
}

export interface RadiusSwapRequest {
  sig: Signature
  encryptedTx: EncryptedTx
}

export interface RadiusSwapResponse {
  data: {
    round: number
    order: number
    mmr_size: number
    proof: string[]
    hash: string
  }
  msg: string
}

const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

// returns a function that will execute a swap, if the parameters are all valid
export default function useSendSwapTransaction(
  account: string | null | undefined,
  chainId: number | undefined,
  library: JsonRpcProvider | undefined,
  trade: AnyTrade | undefined, // trade to execute, required
  swapCalls: Promise<SwapCall[]>,
  deadline: BigNumber | undefined,
  allowedSlippage: Percent,
  sigHandler: () => void
): { callback: null | (() => Promise<RadiusSwapResponse>) } {
  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      callback: async function onSwap(): Promise<RadiusSwapResponse> {
        const resolvedCalls = await swapCalls
        const { deadline, amountIn, amountoutMin, path } = resolvedCalls[0]

        const signer = library.getSigner()
        const nonceManager = new NonceManager(signer)
        const nonce = await nonceManager.getTransactionCount()
        const swapRouterAddress = SWAP_ROUTER_ADDRESSES[chainId]

        const signAddress = await signer.getAddress()

        const signMessage = {
          txOwner: signAddress,
          amountIn: `${amountIn}`,
          amountOutMin: `${amountoutMin}`,
          path,
          to: signAddress,
          deadline,
        }

        const typedData = JSON.stringify({
          types: {
            EIP712Domain: DOMAIN_TYPE,
            Swap: SWAP_TYPE,
          },
          primaryType: 'Swap',
          domain: domain(chainId),
          message: signMessage,
        })

        const sig = await signWithEIP712(library, signAddress, typedData)

        console.log(sig)

        sigHandler()

        const vdfData = await getVdfProof()

        console.log(vdfData)

        const encryptData = await poseidonEncrypt(
          vdfData.s2_string,
          vdfData.s2_field_hex,
          vdfData.commitment_hex,
          `${path[0]},${path[1]}`
        )

        // const encryptData = await poseidonEncryptWithoutProof(vdfData.sym_key, `${path[0]},${path[1]}`)

        console.log(encryptData)

        const txId = solidityKeccak256(
          ['address', 'uint256', 'uint256', 'address[]', 'address', 'uint256'],
          [account.toLowerCase(), `${amountIn}`, `${amountoutMin}`, path, account.toLowerCase(), `${deadline}`]
        )

        const encryptedPath = {
          message_length: encryptData.message_length,
          nonce: `${nonce}`,
          commitment: vdfData.commitment_hex,
          cipher_text: [encryptData.cipher_text],
          r1: vdfData.r1,
          r3: vdfData.r3,
          s1: vdfData.s1,
          s3: vdfData.s3,
          k: vdfData.k,
          vdf_snark_proof: vdfData.vdf_snark_proof,
          encryption_proof: encryptData.proof,
        }

        const encryptedTx: EncryptedTx = {
          txOwner: signAddress,
          amountIn: `${amountIn}`,
          amountOutMin: `${amountoutMin}`,
          path: encryptedPath,
          to: signAddress,
          deadline,
          txId,
        }

        const sendResponse = await sendEIP712Tx(encryptedTx, sig)
        const finalResponse: RadiusSwapResponse = {
          data: sendResponse.data,
          msg: sendResponse.msg,
        }
        return finalResponse
      },
    }
  }, [account, chainId, library, swapCalls, trade, sigHandler])
}

async function signWithEIP712(library: JsonRpcProvider, signAddress: string, typedData: string): Promise<Signature> {
  console.log(signAddress, typedData)
  const signer = library.getSigner()
  const sig = await signer.provider
    .send('eth_signTypedData_v4', [signAddress, typedData])
    .then((response) => {
      console.log(response)
      const sig = splitSignature(response)
      return sig
    })
    .catch((error) => {
      // if the user rejected the sign, pass this along
      if (error?.code === 401) {
        throw new Error(`Sign rejected.`)
      } else {
        // otherwise, the error was unexpected and we need to convey that
        console.error(`Sign failed`, error, signAddress, typedData)

        throw new Error(`Sign failed: ${swapErrorToUserReadableMessage(error)}`)
      }
    })

  return sig
}

async function getVdfProof(): Promise<VdfResponse> {
  const vdf = await import('vdf')
  const data = await vdf
    .get_vdf_proof()
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}

async function poseidonEncrypt(
  s2_string: string,
  s2_field_hex: string,
  commitment: string,
  plainText: string
): Promise<EncryptResponse> {
  console.log(s2_string, commitment, plainText)
  const poseidon = await import('poseidon')
  const data = await poseidon
    .encrypt(s2_string, s2_field_hex, commitment, plainText)
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}

async function poseidonEncryptWithoutProof(s2_string: string, plainText: string): Promise<EncryptResponse> {
  console.log(s2_string, plainText)
  const poseidon = await import('poseidon')
  const data = await poseidon
    .encrypt_without_proof(s2_string, plainText)
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}

async function sendEIP712Tx(encryptedTx: EncryptedTx, signature: Signature): Promise<RadiusSwapResponse> {
  const sendResponse = await fetch('http://147.46.240.248:40002/txs/sendEIP712Tx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      encryptedTx,
      signature: {
        r: `${signature.r}`,
        s: `${signature.s}`,
        v: `${signature.v}`,
      },
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return sendResponse
}
