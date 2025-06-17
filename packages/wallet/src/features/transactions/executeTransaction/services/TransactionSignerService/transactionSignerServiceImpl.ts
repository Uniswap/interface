import type { AccountMeta } from 'uniswap/src/features/accounts/types'
import { PublicClient } from 'viem'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import {
  convertToEIP7702,
  createSignedAuthorization,
  signAndSerializeEIP7702Transaction,
} from 'wallet/src/features/transactions/executeTransaction/eip7702Utils'
import type { TransactionSigner } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'
import type { Provider } from 'wallet/src/features/transactions/executeTransaction/services/providerService'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import type { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export function createTransactionSignerService(ctx: {
  getAccount: () => AccountMeta
  getProvider: () => Promise<Provider>
  getSignerManager: () => SignerManager
}): TransactionSigner {
  // private method
  const getSigner = async (): Promise<NativeSigner> => {
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

  const signAndSendTransaction = getSignAndSendTransaction({
    prepareTransaction,
    signTransaction,
    sendTransaction,
  })

  return { prepareTransaction, signTransaction, sendTransaction, signAndSendTransaction }
}

export function createBundledDelegationTransactionSignerService(ctx: {
  getAccount: () => AccountMeta
  getProvider: () => Promise<Provider>
  getSignerManager: () => SignerManager
  getViemClient: () => Promise<PublicClient>
  getDelegationInfo: () => Promise<DelegationCheckResult>
}): TransactionSigner {
  const baseTransactionSignerService = createTransactionSignerService(ctx)

  // private method
  const getSigner = async (): Promise<NativeSigner> => {
    const signerManager = ctx.getSignerManager()
    const signer = await signerManager.getSignerForAccount(ctx.getAccount())
    return signer.connect(await ctx.getProvider())
  }

  const signTransaction: TransactionSigner['signTransaction'] = async (input) => {
    const signer = await getSigner()
    const delegationInfo = await ctx.getDelegationInfo()
    const account = await ctx.getAccount()
    const chainId = input.chainId

    if (!chainId) {
      throw new Error('Chain ID is required')
    }
    if (!delegationInfo.contractAddress) {
      throw new Error('Delegation contract address is required')
    }

    // Authorization nonce needs to be +1 of the nonce of the transaction
    const authorizationNonce = Number(input.nonce) + 1
    const signedAuthorization = await createSignedAuthorization({
      signer,
      walletAddress: account.address as `0x${string}`,
      chainId,
      contractAddress: delegationInfo.contractAddress,
      nonce: authorizationNonce,
    })

    // Convert to EIP-7702 transaction format
    const viemTxRequest = convertToEIP7702({
      ethersTx: input,
      walletAddress: account.address as `0x${string}`,
      signedAuthorization,
    })
    const signedTx = await signAndSerializeEIP7702Transaction({
      signer,
      tx: viemTxRequest,
      address: account.address,
      chainId,
    })

    return signedTx
  }

  const sendTransaction: TransactionSigner['sendTransaction'] = async (input) => {
    const viemClient = await ctx.getViemClient()
    const ethersProvider = await ctx.getProvider()

    const transactionHash = await viemClient.sendRawTransaction({
      serializedTransaction: input.signedTx as `0x${string}`,
    })
    const transactionResponse = await ethersProvider.getTransaction(transactionHash)
    return transactionResponse
  }

  return {
    prepareTransaction: baseTransactionSignerService.prepareTransaction,
    signTransaction,
    sendTransaction,
    signAndSendTransaction: getSignAndSendTransaction({
      prepareTransaction: baseTransactionSignerService.prepareTransaction,
      signTransaction,
      sendTransaction,
    }),
  }
}

function getSignAndSendTransaction(ctx: {
  prepareTransaction: TransactionSigner['prepareTransaction']
  signTransaction: TransactionSigner['signTransaction']
  sendTransaction: TransactionSigner['sendTransaction']
}): TransactionSigner['signAndSendTransaction'] {
  return async (input) => {
    const populatedRequest = await ctx.prepareTransaction(input)
    const timestampBeforeSign = Date.now()
    const signedTx = await ctx.signTransaction(populatedRequest)
    const timestampBeforeSend = Date.now()
    const transactionResponse = await ctx.sendTransaction({ signedTx })
    return { transactionResponse, populatedRequest, timestampBeforeSign, timestampBeforeSend }
  }
}
