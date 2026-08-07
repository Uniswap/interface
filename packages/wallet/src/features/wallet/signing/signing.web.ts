import { signTypedData } from 'uniswap/src/features/transactions/signing'
import { ensureLeading0x } from 'uniswap/src/utils/addresses'
import { SignMessageInfo, SignTypedDataInfo } from 'wallet/src/features/wallet/signing/signing'
import { formatMessageForSigning, prepareTypedDataForSigning } from 'wallet/src/features/wallet/signing/utils'

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage({
  message,
  account,
  signerManager,
  provider,
  signAsString,
}: SignMessageInfo): Promise<string> {
  // Mobile code does not explicitly connect to provider,
  // Web needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider ? unconnectedSigner.connect(provider) : unconnectedSigner
  const formattedMessage = formatMessageForSigning(message, signAsString)
  const signature = await signer.signMessage(formattedMessage)
  return ensureLeading0x(signature)
}

export async function signTypedDataMessage({
  message,
  account,
  signerManager,
  provider,
  expectedChainId,
}: SignTypedDataInfo): Promise<string> {
  const parsedData = prepareTypedDataForSigning({ message, expectedChainId })

  // Mobile code does not explicitly connect to provider,
  // Web needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider ? unconnectedSigner.connect(provider) : unconnectedSigner

  return signTypedData({
    domain: parsedData.domain,
    types: parsedData.types,
    value: parsedData.message,
    signer,
  })
}
