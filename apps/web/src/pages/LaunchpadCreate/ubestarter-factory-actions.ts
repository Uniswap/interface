import type { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useUbestarterFactory } from 'hooks/useContract'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { usePendingTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { launchpadValidationResult } from './launchpad-state'

export const UBESTARTER_FACTORY_ADDRESS = '0x4f3c58164a816A53e4cfDf4EAE9De84C6D3A87FC'

export function useDeployLauchpadCallback(): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const [validationResult] = useAtom(launchpadValidationResult)

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const factoryContract = useUbestarterFactory(UBESTARTER_FACTORY_ADDRESS)

  const cb = useCallback(async (): Promise<void> => {
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
    if (!validationResult) {
      console.error('no validation result')
      return
    }

    if (!factoryContract || !factoryContract.signer) {
      console.error('contract or signer is null')
      return
    }

    try {
      setIsPending(true)

      console.log([
        validationResult.implementation,
        validationResult.params,
        '0x',
        validationResult.infoCID,
        validationResult.creatorDisclaimerHash,
        validationResult.creatorDisclaimerSignature,
        validationResult.verifierSignature,
      ])

      await factoryContract.estimateGas
        .deployLaunchpad(
          validationResult.implementation,
          validationResult.params,
          '0x',
          validationResult.infoCID,
          validationResult.creatorDisclaimerHash,
          validationResult.creatorDisclaimerSignature,
          validationResult.verifierSignature
        )
        .then((estimatedGasLimit) => {
          return factoryContract
            .deployLaunchpad(
              validationResult.implementation,
              validationResult.params,
              '0x',
              validationResult.infoCID,
              validationResult.creatorDisclaimerHash,
              validationResult.creatorDisclaimerSignature,
              validationResult.verifierSignature,
              {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              }
            )
            .then((response: TransactionResponse) => {
              setTxHash(response.hash)
              addTransaction(response, {
                type: TransactionType.CUSTOM,
                summary: 'Creating Launchpad',
              })
              return response.wait(2)
            })
        })
        .catch((error) => {
          console.error('Failed to send transaction', error)
          setIsPending(false)
          setTxHash('')
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
      setTxHash('')
    }
  }, [isPending, factoryContract, account, pendingTxs, addTransaction, validationResult])

  return [cb, txHash, isPending]
}
