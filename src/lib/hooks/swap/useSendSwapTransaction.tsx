import { BigNumber } from '@ethersproject/bignumber'
import { hexlify, Signature, splitSignature } from '@ethersproject/bytes'
import { NonceManager } from '@ethersproject/experimental'
import { keccak256 } from '@ethersproject/keccak256'
import { JsonRpcProvider } from '@ethersproject/providers'
import { serialize, UnsignedTransaction } from '@ethersproject/transactions'
// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { solidityKeccak256 } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
// import { calculateGasMargin } from 'utils/calculateGasMargin'
// import isZero from 'utils/isZero'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface SwapCall {
  address: string
  calldata: string
  value: string
}

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
  routeContractAddress: string
  amountIn: number
  amountoutMin: number
  path: string
  senderAddress: string
  deadline: number
  chainId: number
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
  swapCalls: SwapCall[],
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
        const { address, calldata, value } = swapCalls[0]

        const gasPrice = hexlify(8000000000)
        const gasLimit = hexlify(9026904)

        const v2trade = trade as InterfaceTrade<Currency, Currency, TradeType>

        const signer = library.getSigner()
        const nonceManager = new NonceManager(signer)

        const nonce = await nonceManager.getTransactionCount()

        const signInput: UnsignedTransaction = {
          data: calldata,
          to: address,
          chainId,
          nonce,
          gasPrice,
          gasLimit,
          value,
        }

        const sig = await signer
          .signMessage(JSON.stringify(signInput)) // sign하고 서버에 날리고 서버가 제출한 트랜잭션 정보를 response로 가져와야함
          .then((response) => {
            const sig = splitSignature(response)
            return sig
          })
          .catch((error) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error(t`Transaction rejected.`)
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Swap failed`, error, address, calldata, value)

              throw new Error(t`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
            }
          })

        sigHandler()

        const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

        const token1 = v2trade.inputAmount.currency as Token
        const address1 = token1.address
        const token2 = v2trade.outputAmount.currency as Token
        const address2 = token2.address
        const path = `${address1},${address2}`
        const pathArray = [address1, address2]

        const signedRawtx = serialize(signInput, sig)
        const txHash = keccak256(signedRawtx)

        const encryptedPath = await fetch('http://147.46.240.248:27100/cryptography/encrypt', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            useVdfZkp: true,
            useEncryptionZkp: false,
            plainText: path,
          }),
        })
          .then((res) => res.json())
          .then(async (res) => {
            return res.data
          })
          .catch((error) => {
            console.log(error)
            return error
          })

        const amountIn = JSBI.toNumber(v2trade.swaps[0].inputAmount.numerator)
        const amountoutMin = 0
        const deadlineNumber = 1753105128

        const txId = solidityKeccak256(
          ['address', 'uint256', 'uint256', 'address[]', 'address', 'uint256'],
          [account, `${amountIn}`, `${amountoutMin}`, pathArray, account, `${deadlineNumber}`]
        )

        const encryptedTx: EncryptedTx = {
          routeContractAddress: address,
          amountIn,
          amountoutMin,
          path: JSON.stringify(encryptedPath),
          senderAddress: account,
          deadline: deadlineNumber,
          chainId,
          nonce: hexlify(nonce),
          gasPrice,
          gasLimit,
          value,
        }

        const sendResponse: { data: RadiusSwapResponse['data']; msg: RadiusSwapResponse['msg'] } = await fetch(
          'http://147.46.240.248:27100/txs/sendTx',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              txType: 'swap',
              txId,
              encryptedTx,
              sig,
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
  }, [account, chainId, library, swapCalls, trade, allowedSlippage, deadline, sigHandler])
}
