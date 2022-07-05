import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { hexlify, Signature, splitSignature } from '@ethersproject/bytes'
import { NonceManager } from '@ethersproject/experimental'
import { keccak256 } from '@ethersproject/keccak256'
import { JsonRpcProvider } from '@ethersproject/providers'
import { serialize, UnsignedTransaction } from '@ethersproject/transactions'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { getAddress, resolveProperties, solidityKeccak256 } from 'ethers/lib/utils'
import { SwapCall } from 'hooks/useSwapCallArguments'
import { useMemo } from 'react'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface SwapCallEstimate {
  call: SwapCall
}

interface SuccessfulCall extends SwapCallEstimate {
  call: SwapCall
  gasEstimate: BigNumber
}

interface FailedCall extends SwapCallEstimate {
  call: SwapCall
  error: Error
}

interface EncryptedTx {
  txId: string
  routeContractAddress: string
  amountIn: string
  amountoutMin: string
  path: string
  senderAddress: string
  deadline: string
  chainId: string
  nonce: string
  gasPrice: string
  gasLimit: string
  value: string
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
  txHash: string
}

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
        const { address, calldata, value, deadline, amountIn, amountoutMin, path } = resolvedCalls[0]

        const signer = library.getSigner()
        const nonceManager = new NonceManager(signer)
        const nonce = await nonceManager.getTransactionCount()
        const gasPrice = hexlify(await nonceManager.getGasPrice())
        const gasLimit = hexlify(1000000)
        const swapRouterAddress = SWAP_ROUTER_ADDRESSES[chainId]

        const txData: TransactionRequest = {
          data: calldata,
          to: swapRouterAddress,
          chainId,
          nonce,
          gasPrice,
          gasLimit,
          value,
        }

        const signAddress = await signer.getAddress()

        const signInput = await resolveProperties(txData).then(async (tx: TransactionRequest) => {
          if (tx.from != null) {
            if (getAddress(tx.from) !== signAddress) {
              console.log('Tx from address mismatch', 'tx.from', tx.from)
            }
            delete tx.from
          }

          return tx as UnsignedTransaction
        })

        const domain = {
          name: 'TEX swap',
          version: '1',
          chainId,
          verifyingContract: SWAP_ROUTER_ADDRESSES[chainId],
        }

        const domain_type = [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ]

        const swap_type = [
          { name: 'data', type: 'bytes' },
          { name: 'to', type: 'address' },
          { name: 'chainId', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'gasLimit', type: 'uint256' },
          { name: 'value', type: 'uint256' },
        ]

        const signData = JSON.stringify({
          types: {
            EIP712Domain: domain_type,
            Swap: swap_type,
          },
          domain,
          primaryType: 'Swap',
          message: signInput,
        })

        const sig = await library
          .send('eth_signTypedData_v4', [signAddress.toLowerCase(), signData])
          .then((response) => {
            const sig = splitSignature(response)
            return sig
          })
          .catch((error) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 401) {
              throw new Error(`Transaction rejected.`)
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, address, calldata, value)

              throw new Error(`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
            }
          })

        sigHandler()

        const signedRawtx = serialize(signInput, sig)
        const txHash = keccak256(signedRawtx)

        const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

        const encryptedPath = await fetch('http://147.46.240.248:40001/cryptography/encrypt', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            msg: `${path[0]},${path[1]}`,
          }),
        })
          .then((res) => res.json())
          .then((res) => {
            return res.data
          })
          .catch((error) => {
            console.log(error)
            return error
          })

        const txId = solidityKeccak256(
          ['address', 'uint256', 'uint256', 'address[]', 'address', 'uint256'],
          [account.toLowerCase(), `${amountIn}`, `${amountoutMin}`, path, account.toLowerCase(), `${deadline}`]
        )

        const encryptedTx: EncryptedTx = {
          routeContractAddress: swapRouterAddress,
          amountIn: `${amountIn}`,
          amountoutMin: `${amountoutMin}`,
          path: encryptedPath,
          senderAddress: account.toLowerCase(),
          deadline: `${deadline}`,
          txId,
          chainId: `${chainId}`,
          nonce: hexlify(nonce),
          gasPrice,
          gasLimit,
          value,
        }

        const sendResponse: { data: RadiusSwapResponse['data']; msg: RadiusSwapResponse['msg'] } = await fetch(
          'http://147.46.240.248:40001/txs/sendTx',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              txType: 'swap',
              encryptedTx,
              signature: {
                ...sig,
                recoveryParam: `${sig.recoveryParam}`,
                v: `${sig.v}`,
              },
            }),
          }
        )
          .then((res) => res.json())
          .then((res) => {
            return res
          })
          .catch((error) => {
            console.log(error)
            return error
          })

        const finalResponse = {
          data: sendResponse.data,
          msg: sendResponse.msg,
          txHash,
        }
        return finalResponse
      },
    }
  }, [account, chainId, library, swapCalls, trade, sigHandler])
}
