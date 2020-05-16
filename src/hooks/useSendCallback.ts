import { BigNumber } from '@ethersproject/bignumber'
import { WETH, TokenAmount, JSBI } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useTokenBalanceTreatingWETHasETH } from '../state/wallet/hooks'

import { calculateGasMargin, getSigner, isAddress } from '../utils'
import { useENSName, useTokenContract, useWeb3React } from './index'

// returns a callback for sending a token amount, treating WETH as ETH
// returns null with invalid arguments
export function useSendCallback(amount?: TokenAmount, recipient?: string): null | (() => Promise<string>) {
  const { library, account, chainId } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const ensName = useENSName(recipient)
  const tokenContract = useTokenContract(amount?.token?.address)
  const balance = useTokenBalanceTreatingWETHasETH(account, amount?.token)

  return useMemo(() => {
    if (!amount) return null
    if (!amount.greaterThan(JSBI.BigInt(0))) return null
    if (!isAddress(recipient)) return null
    if (!balance) return null
    if (balance.lessThan(amount)) return null

    const token = amount?.token

    return async function onSend(): Promise<string> {
      if (token.equals(WETH[chainId])) {
        return getSigner(library, account)
          .sendTransaction({ to: recipient, value: BigNumber.from(amount.raw.toString()) })
          .then(response => {
            addTransaction(response, {
              summary: 'Send ' + amount.toSignificant(3) + ' ' + token?.symbol + ' to ' + (ensName ?? recipient)
            })
            return response.hash
          })
          .catch(error => {
            console.error('Failed to transfer ETH', error)
            throw error
          })
      } else {
        return tokenContract.estimateGas
          .transfer(recipient, amount.raw.toString())
          .then(estimatedGasLimit =>
            tokenContract
              .transfer(recipient, amount.raw.toString(), {
                gasLimit: calculateGasMargin(estimatedGasLimit)
              })
              .then(response => {
                addTransaction(response, {
                  summary: 'Send ' + amount.toSignificant(3) + ' ' + token.symbol + ' to ' + (ensName ?? recipient)
                })
                return response.hash
              })
          )
          .catch(error => {
            console.error('Failed token transfer', error)
            throw error
          })
      }
    }
  }, [addTransaction, library, account, chainId, amount, ensName, recipient, tokenContract, balance])
}
