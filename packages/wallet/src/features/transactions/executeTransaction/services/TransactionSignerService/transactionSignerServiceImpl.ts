import type { Signer } from 'ethers'
import type { AccountMeta } from 'uniswap/src/features/accounts/types'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export function createTransactionSignerService(ctx: {
  getAccount: () => AccountMeta
  getProvider: () => Promise<Provider>
  getSignerManager: () => SignerManager
}): TransactionSigner {
  // private method
  const getSigner = async (): Promise<Signer> => {
    const signerManager = ctx.getSignerManager()
    const signer = await signerManager.getSignerForAccount(ctx.getAccount())
    return signer.connect(await ctx.getProvider())
  }

  // public methods
  const prepareTransaction: TransactionSigner['prepareTransaction'] = async (input) => {
    const signer = await getSigner()
    const populatedRequest = await signer.populateTransaction(input.request)
    return populatedRequest
  }

  const signTransaction: TransactionSigner['signTransaction'] = async (input) => {
    const signer = await getSigner()
    const signedTx = await signer.signTransaction(input)
    return signedTx
  }

  const sendTransaction: TransactionSigner['sendTransaction'] = async (input) => {
    const provider = await ctx.getProvider()
    const transactionResponse = await provider.sendTransaction(input.signedTx)
    return transactionResponse
  }

  const signAndSendTransaction: TransactionSigner['signAndSendTransaction'] = async (input) => {
    const populatedRequest = await prepareTransaction(input)
    const signedTx = await signTransaction(populatedRequest)
    const timestampBeforeSend = Date.now()
    const transactionResponse = await sendTransaction({ signedTx })
    return { transactionResponse, populatedRequest, timestampBeforeSend }
  }

  return { prepareTransaction, signTransaction, sendTransaction, signAndSendTransaction }
}
