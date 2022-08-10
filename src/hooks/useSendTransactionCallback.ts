import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
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
        console.error(error)
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
          // Otherwise, the error was unexpected, and we need to convey that.
          console.error(`Send transaction failed`, error)
          throw new Error(error)
        }
      }
    },
    [account, library],
  )
}
