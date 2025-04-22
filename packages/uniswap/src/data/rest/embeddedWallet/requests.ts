import { createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { EmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import {
  Action,
  AuthenticationTypes,
  ChallengeResponse,
  CreateWalletResponse,
  ExportSeedPhraseResponse,
  ListAuthenticatorsResponse,
  SecuredChallengeResponse,
  SignMessagesResponse,
  SignTransactionsResponse,
  SignTypedDataBatchResponse,
  WalletSigninResponse,
} from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'

const enclaveTransport = createConnectTransport({
  baseUrl: uniswapUrls.evervaultDevUrl,
  credentials: 'include',
})
export const EMBEDDED_WALLET_CLIENT = createPromiseClient(EmbeddedWalletService, enclaveTransport)

const EW_CACHE_KEY = 'EmbeddedWallet'

/* DATA FETCHING FUNCTIONS */
export async function fetchChallengeRequest({
  type,
  action,
}: {
  type: AuthenticationTypes
  action: Action
}): Promise<ChallengeResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'challenge', type, action],
    queryFn: () => EMBEDDED_WALLET_CLIENT.challenge({ type, action }),
  })
}

export async function fetchSecuredChallengeRequest({
  type,
  action,
  b64EncryptionPublicKey,
}: {
  type: AuthenticationTypes
  action: Action
  b64EncryptionPublicKey: string
}): Promise<SecuredChallengeResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'securedChallenge', type, action, b64EncryptionPublicKey],
    queryFn: () => EMBEDDED_WALLET_CLIENT.securedChallenge({ type, action, b64EncryptionPublicKey }),
  })
}

export async function fetchCreateWalletRequest({ credential }: { credential: string }): Promise<CreateWalletResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'createWallet', credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.createWallet({ credential }),
  })
}

export async function fetchWalletSigninRequest({ credential }: { credential: string }): Promise<WalletSigninResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'walletSignin', credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.walletSignin({ credential }),
  })
}

export async function fetchSignMessagesRequest({
  messages,
  credential,
}: {
  messages: string[]
  credential: string | undefined
}): Promise<SignMessagesResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'signMessages', messages, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signMessages({ messages, credential }),
  })
}

export async function fetchSignTransactionRequest({
  transactions,
  credential,
}: {
  transactions: string[]
  credential: string | undefined
}): Promise<SignTransactionsResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'signTransaction', transactions, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signTransactions({ transactions, credential }),
  })
}

export async function fetchSignTypedDataRequest({
  typedDataBatch,
  credential,
}: {
  typedDataBatch: string[]
  credential: string | undefined
}): Promise<SignTypedDataBatchResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'signTypedData', typedDataBatch, credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.signTypedDataBatch({ typedDataBatch, credential }),
  })
}

export async function fetchExportSeedPhraseRequest({
  encryptionKey,
  credential,
}: {
  encryptionKey: string
  credential: string
}): Promise<ExportSeedPhraseResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'exportSeedPhrase', credential, encryptionKey],
    queryFn: () => EMBEDDED_WALLET_CLIENT.exportSeedPhrase({ credential, b64EncryptionPublicKey: encryptionKey }),
  })
}

export async function fetchDisconnectRequest(): Promise<void> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'disconnect'],
    queryFn: () => EMBEDDED_WALLET_CLIENT.disconnectWallet({}),
  })
}

export async function fetchListAuthenticatorsRequest({
  credential,
}: {
  credential: string
}): Promise<ListAuthenticatorsResponse> {
  return await SharedQueryClient.fetchQuery({
    queryKey: [EW_CACHE_KEY, 'listAuthenticatorsRequest', credential],
    queryFn: () => EMBEDDED_WALLET_CLIENT.listAuthenticators({ credential }),
  })
}
