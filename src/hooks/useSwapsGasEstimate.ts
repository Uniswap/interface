import { Trade } from 'dxswap-sdk'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '.'
import { INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { useBlockNumber } from '../state/application/hooks'
import { calculateGasMargin } from '../utils'
import isZero from '../utils/isZero'
import useDebounce from './useDebounce'
import useENS from './useENS'
import { useSwapsCallArguments } from './useSwapCallback'

export function useSwapsGasEstimations(
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE,
  recipientAddressOrName: string | null,
  trades?: (Trade | undefined)[]
): { loading: boolean; estimations: (BigNumber | null)[][] } {
  const blockNumber = useBlockNumber() // used to force updates at each block
  const { account, library, chainId } = useActiveWeb3React()
  const platformSwapCalls = useSwapsCallArguments(trades, allowedSlippage, recipientAddressOrName)

  const [loading, setLoading] = useState(false)
  const [estimations, setEstimations] = useState<(BigNumber | null)[][]>([])
  const debouncedLoading = useDebounce(loading, 300)

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddress || account

  const updateEstimations = useCallback(async () => {
    setLoading(true)
    const estimatedCalls = []
    for (const platformCalls of platformSwapCalls) {
      const specificCalls = []
      for (const call of platformCalls) {
        const {
          parameters: { methodName, args, value },
          contract
        } = call
        const options = !value || isZero(value) ? {} : { value }

        let estimatedCall = null
        try {
          estimatedCall = calculateGasMargin(await contract.estimateGas[methodName](...args, { ...options }))
        } catch (error) {
          console.error(error)
          // silent fail
        } finally {
          specificCalls.push(estimatedCall)
        }
      }
      estimatedCalls.push(specificCalls)
    }
    setEstimations(estimatedCalls)
    setLoading(false)
  }, [platformSwapCalls])

  useEffect(() => {
    if (!trades || trades.length === 0 || !library || !chainId || !recipient) {
      setEstimations([])
      return
    }
    updateEstimations()
  }, [chainId, library, recipient, trades, updateEstimations, blockNumber])

  return { loading: debouncedLoading, estimations }
}
