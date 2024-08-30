import { defaultAbiCoder } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useUbeswapV3FarmingContract, useV3NFTPositionManagerContract } from 'hooks/useContract'
import { type IncentiveKey } from 'pages/Earn/data/v3-incentive-list'
import { useCallback, useState } from 'react'
import { usePendingTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

// deposit, withdraw, collectReward

const FARM_ADDRESS = '0x90415B89D1EF945B8846fFA6118C3fd60eab9e96'

function encodeKeys(keys: IncentiveKey[]) {
  const keyArrayType =
    'tuple(address rewardToken,address pool, uint32 startTime, uint32 lockTime, int24 minimumTickRange, int24 maxTickLower, int24 minTickLower, int24 maxTickUpper, int24 minTickUpper)[]'
  return defaultAbiCoder.encode([keyArrayType], [keys])
}

export function useDepositCallback(): [boolean, (tokenId: BigNumber, incentives: IncentiveKey[]) => Promise<void>] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)

  const nftContract = useV3NFTPositionManagerContract(true)

  const cb = useCallback(
    async (tokenId: BigNumber, incentives: IncentiveKey[]): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!nftContract || !nftContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (tokenId.eq(0)) {
        console.error('tokenId is zero')
        return
      }

      try {
        setIsPending(true)

        const data = encodeKeys(incentives)

        const convertArgs = [account, FARM_ADDRESS, tokenId.toString(), data] as const
        const functionName = 'safeTransferFrom(address,address,uint256,bytes)' as const
        await nftContract.estimateGas[functionName](...convertArgs)
          .then((estimatedGasLimit) => {
            return nftContract[functionName](...convertArgs, {
              gasLimit: calculateGasMargin(estimatedGasLimit),
            }).then((response: TransactionResponse) => {
              addTransaction(response, {
                type: TransactionType.CUSTOM,
                summary: 'Depositing to V3 Farm',
              })
              return response.wait(2)
            })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            setIsPending(false)
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        setIsPending(false)
      }
    },
    [isPending, nftContract, account, pendingTxs, addTransaction]
  )

  return [isPending, cb]
}

export function useWithdrawCallback(): [boolean, (tokenId: BigNumber, incentives: IncentiveKey[]) => Promise<void>] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)

  const farmContract = useUbeswapV3FarmingContract(FARM_ADDRESS)

  const cb = useCallback(
    async (tokenId: BigNumber, incentives: IncentiveKey[]): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!farmContract || !farmContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (tokenId.eq(0)) {
        console.error('tokenId is zero')
        return
      }

      try {
        setIsPending(true)

        const calldatas: string[] = [
          ...incentives.map((incentive) =>
            farmContract.interface.encodeFunctionData('unstakeToken', [incentive, tokenId])
          ),
          farmContract.interface.encodeFunctionData('withdrawToken', [tokenId, account, '0x']),
        ]
        await farmContract.estimateGas
          .multicall(calldatas)
          .then((estimatedGasLimit) => {
            return farmContract
              .multicall(calldatas, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Withdraw from V3 Farm',
                })
                return response.wait(2)
              })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            setIsPending(false)
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        setIsPending(false)
      }
    },
    [isPending, farmContract, account, pendingTxs, addTransaction]
  )

  return [isPending, cb]
}
