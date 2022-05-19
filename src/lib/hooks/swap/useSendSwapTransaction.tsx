import { BigNumber } from '@ethersproject/bignumber'
import { Signature, splitSignature } from '@ethersproject/bytes'
import { JsonRpcProvider } from '@ethersproject/providers'
// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
// import { calculateGasMargin } from 'utils/calculateGasMargin'
import isZero from 'utils/isZero'
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

export interface SendData {
  sig: Signature
  encryptedTx: EncryptedTx
}

// returns a function that will execute a swap, if the parameters are all valid
export default function useSendSwapTransaction(
  account: string | null | undefined,
  chainId: number | undefined,
  library: JsonRpcProvider | undefined,
  trade: AnyTrade | undefined, // trade to execute, required
  swapCalls: SwapCall[]
): { callback: null | (() => Promise<SendData>) } {
  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      callback: async function onSwap(): Promise<SendData> {
        const estimatedCalls: SwapCallEstimate[] = await Promise.all(
          swapCalls.map((call) => {
            const { address, calldata, value } = call

            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                  }

            return library
              .estimateGas(tx)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                return library
                  .call(tx)
                  .then((result) => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: <Trans>Unexpected issue with estimating the gas. Please try again.</Trans> }
                  })
                  .catch((callError) => {
                    console.debug('Call threw error', call, callError)
                    return { call, error: swapErrorToUserReadableMessage(callError) }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        let bestCallOption: SuccessfulCall | SwapCallEstimate | undefined = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

        // check if any calls errored with a recognizable error
        if (!bestCallOption) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          const firstNoErrorCall = estimatedCalls.find<SwapCallEstimate>(
            (call): call is SwapCallEstimate => !('error' in call)
          )
          if (!firstNoErrorCall) throw new Error(t`Unexpected error. Could not estimate gas for the swap.`)
          bestCallOption = firstNoErrorCall
        }

        const {
          call: { address, calldata, value },
        } = bestCallOption

        const signInput = {
          data: calldata,
          to: address,
          chainId,
          nonce: '0x10',
          gasPrice: '0x01',
          gasLimit: '0x989680',
          value,
        }

        const sig = await library
          .getSigner()
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

        const headers = new Headers({ 'Content-Type': 'application/json' })

        const encryptedTx = await fetch('http://147.46.240.248:27100/cryptography/encrypt', {
          method: 'POST',
          // headers,
          // mode: 'no-cors',
          body: JSON.stringify({
            useVdfZkp: true,
            useEncryptionZkp: false,
            plainText: '123123123',
          }),
        })
          .then((res) => {
            console.log(res)
            return res
          })
          .catch((error) => {
            console.log(error)
            return error
          })

        return {
          sig,
          encryptedTx,
        }
      },
    }
  }, [account, chainId, library, swapCalls, trade])
}
