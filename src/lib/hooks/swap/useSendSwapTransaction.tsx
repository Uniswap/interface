import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { arrayify, hexlify, Signature, splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
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
import TEX_JSON from 'abis/tex-router.json'
import { V2_ROUTER_ADDRESS } from 'constants/addresses'
import { getAddress, resolveProperties, solidityKeccak256 } from 'ethers/lib/utils'
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

        const amountIn = JSBI.toNumber(v2trade.swaps[0].inputAmount.numerator)
        const amountoutMin = 0
        const deadlineNumber = 1753105128

        const token1 = v2trade.inputAmount.currency as Token
        const address1 = token1.address
        const token2 = v2trade.outputAmount.currency as Token
        const address2 = token2.address
        const path = `${address1},${address2}`
        const pathArray = [address1, address2]

        const { abi: TEX_ABI } = TEX_JSON

        console.log(V2_ROUTER_ADDRESS[chainId])

        const texContract = new Contract('0x0a2786fE3fbFFC12f3853682C50A1d6df43C35F7', TEX_ABI, library)

        console.log(texContract)

        const resData: TransactionRequest = await texContract.populateTransaction.swapExactTokensForTokens(
          `${amountIn}`,
          `${amountoutMin}`,
          pathArray,
          account,
          deadlineNumber
        )
        const txData: TransactionRequest = {
          data: resData.data,
          to: address,
          chainId,
          nonce,
          gasPrice,
          gasLimit,
          value,
        }

        console.log('txData: ', txData)

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

        console.log('signInput: ', signInput)

        const serializedTx = serialize(signInput)

        console.log('serializededTx: ', serializedTx)

        const keccak = keccak256(serializedTx)

        console.log('keccak: ', keccak)

        // const sig = await signer
        //   .signMessage('0x510117900b504b38b5aa29db30ee27f92c30f3c29c2491380b5e2f9f200b547d')

        // const data = '0x510117900b504b38b5aa29db30ee27f92c30f3c29c2491380b5e2f9f200b547d'
        const data = arrayify(keccak)
        console.log(data, signAddress)

        // const sig = await library
        //   .send('personal_sign', [keccak, signAddress])
        const sig = await signer
          .signMessage(data)
          .then((response) => {
            console.log('response: ', response)
            const sig = splitSignature(response)
            console.log('sig: ', sig)

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

        const signedRawtx = serialize(signInput, sig)
        const txHash = keccak256(signedRawtx)

        const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

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
            console.log(res.data)
            return res.data
          })
          .catch((error) => {
            console.log(error)
            return error
          })

        const txId = solidityKeccak256(
          ['address', 'uint256', 'uint256', 'address[]', 'address', 'uint256'],
          [account, `${amountIn}`, `${amountoutMin}`, pathArray, account, `${deadlineNumber}`]
        )

        const encryptedTx: EncryptedTx = {
          routeContractAddress: address,
          amountIn,
          amountoutMin,
          path: encryptedPath,
          senderAddress: account,
          deadline: deadlineNumber,
          chainId,
          nonce: hexlify(nonce),
          gasPrice,
          gasLimit,
          value,
        }

        // const testSig = {
        //   r: '0x9d0ed1de198b29fc9fa6fe59ec248471bdc2c5802ea44ff8a4af40f7270c158a',
        //   s: '0x196f75e05c0ed3cc08496642c2ec302b2cdb0abd6763cc348dbbd6c36d3e1417',
        //   _vs: '0x996f75e05c0ed3cc08496642c2ec302b2cdb0abd6763cc348dbbd6c36d3e1417',
        //   recoveryParam: 1,
        //   v: 28,
        //   yParityAndS: '0x996f75e05c0ed3cc08496642c2ec302b2cdb0abd6763cc348dbbd6c36d3e1417',
        //   compact:
        //     '0x9d0ed1de198b29fc9fa6fe59ec248471bdc2c5802ea44ff8a4af40f7270c158a996f75e05c0ed3cc08496642c2ec302b2cdb0abd6763cc348dbbd6c36d3e1417',
        // }

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
  }, [account, chainId, library, swapCalls, trade, sigHandler])
}
