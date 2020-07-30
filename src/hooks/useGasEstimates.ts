import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { ChainId } from '@uniswap/sdk'
import { useEffect, useMemo, useState } from 'react'
import { useBlockNumber } from '../state/application/hooks'
import { Call } from '../state/multicall/actions'
import isZero from '../utils/isZero'
import { useActiveWeb3React } from './index'

export enum GasEstimateState {
  INVALID,
  LOADING,
  VALID
}

export interface EstimatableContractCall {
  contract: Contract // the contract to call
  methodName: string // the method to call on the contract
  args: (string | string[])[] // args to pass to the call
  value: string // hex ether value to send with the transaction
}

interface SerializedEstimatableCall extends Call {
  value: string
}

function toEstimatableCall(estimatable: EstimatableContractCall): SerializedEstimatableCall {
  return {
    address: estimatable.contract.address,
    callData: estimatable.contract.interface.encodeFunctionData(
      estimatable.contract.interface.getFunction(estimatable.methodName),
      estimatable.args
    ),
    value: estimatable.value
  }
}

function toCallKey(chainId: ChainId, call: SerializedEstimatableCall): string {
  return `${chainId}:${call.address}:${call.callData}:${isZero(call.value) ? '' : call.value}`
}

/**
 * Return the gas estimate for the given contract methods and arguments
 */
export default function useGasEstimates(
  calls: (EstimatableContractCall | undefined)[] | undefined
): [GasEstimateState, BigNumber | undefined][] {
  const { chainId, library, account } = useActiveWeb3React()
  const lastBlockNumber = useBlockNumber()

  const [state, setState] = useState<{
    [callKey: string]: {
      blockNumber: number
      estimate: BigNumber | undefined
      error: string | undefined
      fetchingBlockNumber: number | undefined
    }
  }>({})

  // clear estimates on chain change for memory usage
  useEffect(() => {
    if (!chainId) return
    setState({})
  }, [chainId])

  const serializedEstimatableCalls: (SerializedEstimatableCall | undefined)[] = useMemo(() => {
    return (
      calls?.map(call => {
        try {
          return call ? toEstimatableCall(call) : undefined
        } catch (error) {
          return undefined
        }
      }) ?? []
    )
  }, [calls])

  useEffect(() => {
    if (!library || !chainId || !lastBlockNumber) return
    serializedEstimatableCalls.forEach(call => {
      if (!call) return
      const key = toCallKey(chainId, call)
      if ((state[key]?.blockNumber ?? 0) >= lastBlockNumber) {
        return
      }
      if ((state[key]?.fetchingBlockNumber ?? 0) >= lastBlockNumber) {
        return
      }
      setState(state => {
        return {
          ...state,
          [key]: {
            ...state[key],
            fetchingBlockNumber: lastBlockNumber
          }
        }
      })
      try {
        library
          .estimateGas({
            from: account ?? undefined,
            to: call.address,
            data: call.callData,
            ...(isZero(call.value) ? {} : { value: call.value })
          })
          .then(estimate => {
            setState(state => {
              return {
                ...state,
                [key]: {
                  blockNumber: lastBlockNumber,
                  error: undefined,
                  estimate,
                  fetchingBlockNumber: undefined
                }
              }
            })
          })
          .catch(error => {
            setState(state => {
              return {
                ...state,
                [key]: {
                  blockNumber: lastBlockNumber,
                  error: error.message,
                  estimate: undefined,
                  fetchingBlockNumber: undefined
                }
              }
            })
          })
      } catch (error) {
        setState(state => {
          return {
            ...state,
            [key]: {
              blockNumber: lastBlockNumber,
              estimate: undefined,
              error: error.message,
              fetchingBlockNumber: undefined
            }
          }
        })
      }
    })
  }, [serializedEstimatableCalls, chainId, state, lastBlockNumber, library, account])

  return useMemo(() => {
    return (
      serializedEstimatableCalls?.map(call => {
        if (!call || !chainId) return [GasEstimateState.INVALID, undefined]
        const result = state[toCallKey(chainId, call)]
        if (!result) return [GasEstimateState.LOADING, undefined]
        const { estimate, error, blockNumber } = result
        const loading = !error && (!estimate || blockNumber !== lastBlockNumber)
        return [
          error ? GasEstimateState.INVALID : loading ? GasEstimateState.LOADING : GasEstimateState.VALID,
          error ? undefined : estimate
        ]
      }) ?? []
    )
  }, [chainId, lastBlockNumber, serializedEstimatableCalls, state])
}
