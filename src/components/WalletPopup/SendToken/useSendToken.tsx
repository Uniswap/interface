import { Currency } from '@kyberswap/ks-sdk-core'
import { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useTokenContract } from 'hooks/useContract'
import connection from 'state/connection/connection'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

export default function useSendToken(currency: Currency | undefined, recipient: string, amount: string) {
  const { account, isEVM, walletSolana, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [estimateGas, setGasFee] = useState<number | null>(null)
  const tokenContract = useTokenContract(isSolana ? undefined : currency?.wrapped.address)
  const addTransactionWithType = useTransactionAdder()
  const [isSending, setIsSending] = useState(false)
  const { publicKey } = useWallet()

  const prepareTransactionSolana = useCallback(async () => {
    const amountIn = tryParseAmount(amount, currency)
    if (!publicKey || !currency || !recipient || !amountIn || !walletSolana || !connection) {
      return Promise.reject('wrong input')
    }
    const recipientAddress = new PublicKey(recipient)
    let transaction: Transaction
    if (!currency.isNative) {
      const tokenKey = new PublicKey(currency.wrapped.address)
      const [fromTokenAccount, toTokenAccount] = await Promise.all([
        getOrCreateAssociatedTokenAccount(connection, publicKey as any, tokenKey, publicKey),
        getOrCreateAssociatedTokenAccount(connection, publicKey as any, tokenKey, recipientAddress),
      ])
      transaction = new Transaction().add(
        createTransferCheckedInstruction(
          fromTokenAccount.address,
          tokenKey,
          toTokenAccount.address,
          publicKey,
          BigInt(amountIn.quotient.toString()),
          currency.decimals,
        ),
      )
    } else {
      transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientAddress,
          lamports: BigInt(amountIn.quotient.toString()),
        }),
      )
    }

    const { blockhash } = await connection.getLatestBlockhash('finalized')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = publicKey

    return transaction
  }, [publicKey, recipient, amount, walletSolana, currency])

  useEffect(() => {
    if (!currency || !amount || !recipient) {
      setGasFee(null)
      return
    }
    async function getGasFee() {
      try {
        if (!library || !tokenContract || !currency) {
          setGasFee(null)
          return
        }
        const promise = currency?.isNative
          ? library.estimateGas({
              from: account,
              to: recipient,
              value: ethers.utils.parseEther(amount),
            })
          : tokenContract.estimateGas.transfer(recipient, ethers.utils.parseUnits(amount, currency.decimals))

        const [estimateGas, gasPrice] = await Promise.all([promise, library.getSigner().getGasPrice()])
        const format = gasPrice && estimateGas ? ethers.utils.formatEther(estimateGas.mul(gasPrice)) : null
        setGasFee(format ? parseFloat(format) : null)
      } catch (error) {
        setGasFee(null)
      }
    }

    async function getGasFeeSolana() {
      try {
        const transaction = await prepareTransactionSolana()
        const fee = await transaction.getEstimatedFee(connection)
        setGasFee(fee / LAMPORTS_PER_SOL)
      } catch (error) {
        setGasFee(null)
      }
    }
    isEVM ? getGasFee() : getGasFeeSolana()
  }, [library, account, amount, currency, prepareTransactionSolana, isEVM, recipient, tokenContract, isSolana])

  const addTransaction = useCallback(
    (hash: string) => {
      if (!currency) return
      addTransactionWithType({
        type: TRANSACTION_TYPE.TRANSFER_TOKEN,
        hash,
        extraInfo: {
          tokenAddress: currency.wrapped.address,
          tokenAmount: amount,
          tokenSymbol: currency.symbol ?? '',
          contract: recipient,
        },
      })
    },
    [currency, amount, addTransactionWithType, recipient],
  )

  const sendTokenEvm = useCallback(async () => {
    try {
      if (!account || !tokenContract || !library || !amount || !recipient || !currency) {
        return Promise.reject('wrong input')
      }
      const currentGasPrice = await library.getSigner().getGasPrice()
      const gasPrice = ethers.utils.hexlify(currentGasPrice)
      setIsSending(true)
      let transaction
      if (currency.isNative) {
        const tx = { from: account, to: recipient, value: ethers.utils.parseEther(amount), gasPrice }
        transaction = await library.getSigner().sendTransaction(tx)
      } else {
        const numberOfTokens = ethers.utils.parseUnits(amount, currency.decimals)
        transaction = await tokenContract.transfer(recipient, numberOfTokens)
      }
      addTransaction(transaction.hash)
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [amount, account, currency, library, recipient, tokenContract, addTransaction])

  const sendTokenSolana = useCallback(async () => {
    try {
      const amountIn = tryParseAmount(amount, currency)
      if (!publicKey || !currency || !recipient || !amountIn || !walletSolana) {
        return Promise.reject('wrong input')
      }
      setIsSending(true)
      const transaction = await prepareTransactionSolana()
      const signedTx = await (walletSolana.wallet?.adapter as SignerWalletAdapter)?.signTransaction(transaction)
      const hash = await connection.sendRawTransaction(Buffer.from(signedTx.serialize()))
      addTransaction(hash)
      setIsSending(false)
    } catch (error) {
      setIsSending(false)
      throw error
    }
    return
  }, [publicKey, recipient, amount, addTransaction, prepareTransactionSolana, walletSolana, currency])

  return { sendToken: isEVM ? sendTokenEvm : sendTokenSolana, isSending, estimateGas }
}
