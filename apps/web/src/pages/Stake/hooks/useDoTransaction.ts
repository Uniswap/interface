import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { CallOverrides, Contract, ContractTransaction, PayableOverrides } from '@ethersproject/contracts'
import { TransactionRequest } from '@ethersproject/providers'
import { SUPPORTED_CHAINS } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

type Head<T extends any[]> = Required<T> extends [...infer H, any] ? H : never
type Last<T extends Array<unknown>> = Required<T> extends [...unknown[], infer L] ? L : never
type MethodArgs<C extends Contract, M extends keyof C['estimateGas']> = Head<Parameters<C['estimateGas'][M]>>

export type DoTransactionFn = <
  C extends Contract,
  M extends string & keyof C['estimateGas'],
  O extends Last<Parameters<C['estimateGas'][M]>> & (PayableOverrides | CallOverrides)
>(
  contract: C,
  methodName: M,
  args: {
    args: MethodArgs<C, M>
    raw?: TransactionRequest
    overrides?: O
    summary?: string
  }
) => Promise<ContractTransaction>

type ContractCall = {
  contract: Contract
  methodName: string
  args: unknown[]
  value?: BigNumberish | Promise<BigNumberish>
}

const estimateGas = async (call: ContractCall): Promise<BigNumber> => {
  const { contract, methodName, args, value } = call
  const fullArgs = value ? [...args, { value }] : args
  try {
    return await contract.estimateGas[methodName](...fullArgs)
  } catch (gasError) {
    console.debug('Gas estimate failed, trying eth_call to extract error', call)
    try {
      const result = await contract.callStatic[methodName](...fullArgs)
      console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
      throw new Error('Unexpected issue with estimating the gas. Please try again.')
    } catch (callError: any) {
      console.debug('Call threw error', call, callError)
      let errorMessage: string
      switch (callError.reason) {
        case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
        case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
          errorMessage =
            'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
          break
        default:
          errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`
      }
      throw new Error(errorMessage)
    }
  }
}

/**
 * Allows performing transactions.
 * @returns
 */
export const useDoTransaction = (): DoTransactionFn => {
  const addTransaction = useTransactionAdder()
  const { chainId, provider } = useWeb3React()
  return useCallback(
    async (contractDisconnected, methodName, args): Promise<ContractTransaction> => {
      if (SUPPORTED_CHAINS.includes(chainId ?? 0) == false) {
        throw new Error('baklava not supported')
      }
      if (!provider) {
        throw new Error('no provider')
      }
      const signer = provider.getSigner()
      if (!signer) {
        throw new Error('no signer')
      }
      const contract = contractDisconnected.connect(signer)
      const call = { contract, methodName, args: args.args, value: args.overrides?.value }
      const gasEstimate = await estimateGas(call)

      try {
        let response: ContractTransaction
        if (args.raw) {
          response = await signer.sendTransaction(args.raw)
        } else {
          response = await contract[methodName](...args.args, {
            gasLimit: calculateGasMargin(gasEstimate),
            ...args.overrides,
          })
        }
        addTransaction(response, {
          type: TransactionType.CUSTOM,
          summary: 'Convert to new UBE',
        })
        return response
      } catch (error: any) {
        // if the user rejected the tx, pass this along
        if (error?.code === 4001) {
          throw new Error('Transaction rejected.')
        } else {
          // otherwise, the error was unexpected and we need to convey that
          console.error(`Transaction failed`, error, methodName, args, call.value)
          throw new Error(`Transaction failed: ${error.message}`)
        }
      }
    },
    [addTransaction, chainId, provider]
  )
}
