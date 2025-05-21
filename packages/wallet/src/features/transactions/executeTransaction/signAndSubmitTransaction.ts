import { providers } from 'ethers'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { SignedAuthorization } from 'viem/experimental'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'

// TODO: Remove in upstack PR
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let signedAuthorization: SignedAuthorization | undefined

export async function signAndSubmitTransaction(
  request: providers.TransactionRequest,
  account: AccountMeta,
  provider: providers.Provider,
  signerManager: SignerManager,
): Promise<{
  transactionResponse: providers.TransactionResponse
  populatedRequest: providers.TransactionRequest
  timestampBeforeSend: number
}> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTx = await connectedSigner.signTransaction(populatedRequest)
  const timestampBeforeSend = Date.now()
  const transactionResponse = await provider.sendTransaction(signedTx)
  return { transactionResponse, populatedRequest, timestampBeforeSend }
}
