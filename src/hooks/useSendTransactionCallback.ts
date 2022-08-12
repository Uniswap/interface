import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Severity, captureException } from '@sentry/react'
import { ethers } from 'ethers'
import { useCallback } from 'react'

import { useActiveWeb3React } from 'hooks/index'
import { calculateGasMargin } from 'utils'

export default function useSendTransactionCallback() {
  const { account, library } = useActiveWeb3React()

  return useCallback(
    async (
      contractAddress: string,
      encodedData: string,
      value: BigNumber,
      handler?: (response: TransactionResponse) => void,
    ): Promise<string | undefined> => {
      if (!account || !library) return

      const estimateGasOption = {
        from: account,
        to: contractAddress,
        data: encodedData,
        value,
      }

      let gasEstimate: ethers.BigNumber | undefined
      try {
        gasEstimate = await library.getSigner().estimateGas(estimateGasOption)
      } catch (error) {
        const e = new Error('Swap failed', { cause: error })
        e.name = 'SwapError'

        captureException(e, {
          level: Severity.Critical,
          extra: estimateGasOption,
        })

        throw new Error(
          'gasEstimate not found: Unexpected error. Please contact support: none of the calls threw an error',
        )
      }

      const sendTransactionOption = {
        from: account,
        to: contractAddress,
        data: encodedData,
        gasLimit: calculateGasMargin(gasEstimate),
        ...(value.eq('0') ? {} : { value }),
      }

      try {
        const response = await library.getSigner().sendTransaction(sendTransactionOption)
        handler && handler(response)
        return response.hash
      } catch (error) {
        // if the user rejected the tx, pass this along
        if (error?.code === 4001) {
          throw new Error('Transaction rejected.')
        } else {
          const e = new Error('Swap failed', { cause: error })
          e.name = 'SwapError'

          captureException(e, {
            level: Severity.Critical,
            extra: sendTransactionOption,
          })

          // Otherwise, the error was unexpected, and we need to convey that.
          throw new Error(error)
        }
      }
    },
    [account, library],
  )
}
