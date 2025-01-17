import type { TransactionResponse } from '@ethersproject/providers'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useUbestarterLaunchpadV1 } from 'hooks/useContract'
import { useAtom } from 'jotai'
import { getUserSignatureAtom } from 'pages/LaunchpadCreate/launchpad-state'
import { useCallback, useState } from 'react'
import { usePendingTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

export function useCancelCallback(launchpadAddress?: string): [(reason: string) => Promise<void>, string, boolean] {
  const { account } = useWeb3React()

  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(
    async (reason: string): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (!contract || !contract.signer) {
        console.error('contract or signer is null')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      try {
        setIsPending(true)

        await contract.estimateGas
          .cancel(reason)
          .then((estimatedGasLimit) => {
            return contract
              .cancel(reason, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                setTxHash(response.hash)
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Canceling launchpad',
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
    },
    [isPending, contract, account, pendingTxs, addTransaction]
  )

  return [cb, txHash, isPending]
}

export function useBuyCallback(
  launchpadAddress?: string
): [(amountQuoteToken: CurrencyAmount<Token>) => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const [signature] = useAtom(getUserSignatureAtom(account))

  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(
    async (amountQuoteToken: CurrencyAmount<Token>): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (!contract || !contract.signer) {
        console.error('contract or signer is null')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }
      if (!amountQuoteToken) {
        console.error('amountQuoteToken is null')
        return
      }
      if (!(signature && signature.length > 5)) {
        console.error('invalid disclaimer signature')
        return
      }

      try {
        setIsPending(true)

        await contract.estimateGas
          .buy(amountQuoteToken.quotient.toString(), signature)
          .then((estimatedGasLimit) => {
            return contract
              .buy(amountQuoteToken.quotient.toString(), signature, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                setTxHash(response.hash)
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Buy from launchpad',
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
    },
    [isPending, contract, account, pendingTxs, addTransaction, signature]
  )

  return [cb, txHash, isPending]
}

export function useCreateLiquidity(launchpadAddress?: string): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(async (): Promise<void> => {
    if (!account) {
      console.error('no account')
      return
    }
    if (pendingTxs.length > 0) {
      console.error('already pending transaction')
      return
    }
    if (!contract || !contract.signer) {
      console.error('contract or signer is null')
      return
    }
    if (isPending) {
      console.error('already pending')
      return
    }

    try {
      setIsPending(true)

      await contract
        .createLiquidity()
        .then((response: TransactionResponse) => {
          setTxHash(response.hash)
          addTransaction(response, {
            type: TransactionType.CUSTOM,
            summary: 'Creating Liquidity',
          })
          return response.wait(2)
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
  }, [isPending, contract, account, pendingTxs, addTransaction])

  return [cb, txHash, isPending]
}

export function useUserClaim(launchpadAddress?: string): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(async (): Promise<void> => {
    if (!account) {
      console.error('no account')
      return
    }
    if (pendingTxs.length > 0) {
      console.error('already pending transaction')
      return
    }
    if (!contract || !contract.signer) {
      console.error('contract or signer is null')
      return
    }
    if (isPending) {
      console.error('already pending')
      return
    }

    try {
      setIsPending(true)

      await contract
        .userClaim()
        .then((response: TransactionResponse) => {
          setTxHash(response.hash)
          addTransaction(response, {
            type: TransactionType.CUSTOM,
            summary: 'Claiming Tokens',
          })
          return response.wait(2)
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
  }, [isPending, contract, account, pendingTxs, addTransaction])

  return [cb, txHash, isPending]
}

export function useOwnerClaim(launchpadAddress?: string): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(async (): Promise<void> => {
    if (!account) {
      console.error('no account')
      return
    }
    if (pendingTxs.length > 0) {
      console.error('already pending transaction')
      return
    }
    if (!contract || !contract.signer) {
      console.error('contract or signer is null')
      return
    }
    if (isPending) {
      console.error('already pending')
      return
    }

    try {
      setIsPending(true)

      await contract
        .ownerClaim({
          gasLimit: 500_000,
        })
        .then((response: TransactionResponse) => {
          setTxHash(response.hash)
          addTransaction(response, {
            type: TransactionType.CUSTOM,
            summary: 'Claiming Tokens',
          })
          return response.wait(2)
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
  }, [isPending, contract, account, pendingTxs, addTransaction])

  return [cb, txHash, isPending]
}

export function useUserRefund(launchpadAddress?: string): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(async (): Promise<void> => {
    if (!account) {
      console.error('no account')
      return
    }
    if (pendingTxs.length > 0) {
      console.error('already pending transaction')
      return
    }
    if (!contract || !contract.signer) {
      console.error('contract or signer is null')
      return
    }
    if (isPending) {
      console.error('already pending')
      return
    }

    try {
      setIsPending(true)

      await contract.estimateGas
        .userRefund()
        .then((estimatedGasLimit) => {
          return contract
            .userRefund({
              gasLimit: calculateGasMargin(estimatedGasLimit),
            })
            .then((response: TransactionResponse) => {
              setTxHash(response.hash)
              addTransaction(response, {
                type: TransactionType.CUSTOM,
                summary: 'Getting refund tokens',
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
  }, [isPending, contract, account, pendingTxs, addTransaction])

  return [cb, txHash, isPending]
}

export function useOwnerRefund(launchpadAddress?: string): [() => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const contract = useUbestarterLaunchpadV1(launchpadAddress)

  const cb = useCallback(async (): Promise<void> => {
    if (!account) {
      console.error('no account')
      return
    }
    if (pendingTxs.length > 0) {
      console.error('already pending transaction')
      return
    }
    if (!contract || !contract.signer) {
      console.error('contract or signer is null')
      return
    }
    if (isPending) {
      console.error('already pending')
      return
    }

    try {
      setIsPending(true)

      await contract.estimateGas
        .ownerRefund()
        .then((estimatedGasLimit) => {
          return contract
            .ownerRefund({
              gasLimit: calculateGasMargin(estimatedGasLimit),
            })
            .then((response: TransactionResponse) => {
              setTxHash(response.hash)
              addTransaction(response, {
                type: TransactionType.CUSTOM,
                summary: 'Getting refund tokens',
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
  }, [isPending, contract, account, pendingTxs, addTransaction])

  return [cb, txHash, isPending]
}
