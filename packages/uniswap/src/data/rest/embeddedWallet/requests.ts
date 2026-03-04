import { createPromiseClient, type Transport } from '@connectrpc/connect'
import { EmbeddedWalletService as OldEmbeddedWalletService } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_connect'
import type { EmbeddedWalletApiClient as EmbeddedWalletApiClientType, EmbeddedWalletClientContext } from '@universe/api'
import { createEmbeddedWalletApiClient, getTransport } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/getVersionHeader'
import { isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

function createEmbeddedWalletTransport(): Transport {
  return getTransport({
    getBaseUrl: () => uniswapUrls.privyEmbeddedWalletUrl,
    getHeaders: () => ({
      ...(isMobileApp && { Origin: uniswapUrls.requestOriginUrl }),
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
    }),
    options: { credentials: 'include' },
  })
}

const embeddedWalletTransport = createEmbeddedWalletTransport()

const oldEmbeddedWalletRpcClient = createPromiseClient(OldEmbeddedWalletService, embeddedWalletTransport)

let _apiClientPromise: Promise<EmbeddedWalletApiClientType> | undefined

async function getApiClient(): Promise<EmbeddedWalletApiClientType> {
  if (!_apiClientPromise) {
    _apiClientPromise = (async (): Promise<EmbeddedWalletApiClientType> => {
      try {
        const { EmbeddedWalletService: NewEmbeddedWalletService } = await import(
          /* @vite-ignore */
          '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_connect'
        )
        const newRpcClient = createPromiseClient(
          NewEmbeddedWalletService,
          embeddedWalletTransport,
        ) as unknown as EmbeddedWalletClientContext['rpcClient']
        return createEmbeddedWalletApiClient({
          rpcClient: newRpcClient,
          legacyRpcClient: oldEmbeddedWalletRpcClient,
        })
      } catch {
        throw new Error('Embedded Wallet requires @uniswap/client-privy-embedded-wallet (private Uniswap package). ')
      }
    })()
  }
  return _apiClientPromise
}

getApiClient().catch(() => {
  // Expected to fail without NPM_READ_ONLY_TOKEN
})

export const EmbeddedWalletApiClient: EmbeddedWalletApiClientType = {
  fetchChallengeRequest: (...args) => getApiClient().then((c) => c.fetchChallengeRequest(...args)),
  fetchCreateWalletRequest: (...args) => getApiClient().then((c) => c.fetchCreateWalletRequest(...args)),
  fetchWalletSigninRequest: (...args) => getApiClient().then((c) => c.fetchWalletSigninRequest(...args)),
  fetchSignMessagesRequest: (...args) => getApiClient().then((c) => c.fetchSignMessagesRequest(...args)),
  fetchSignTransactionsRequest: (...args) => getApiClient().then((c) => c.fetchSignTransactionsRequest(...args)),
  fetchSignTypedDataRequest: (...args) => getApiClient().then((c) => c.fetchSignTypedDataRequest(...args)),
  fetchDisconnectRequest: (...args) => getApiClient().then((c) => c.fetchDisconnectRequest(...args)),
  fetchSecuredChallengeRequest: (...args) => getApiClient().then((c) => c.fetchSecuredChallengeRequest(...args)),
  fetchExportSeedPhraseRequest: (...args) => getApiClient().then((c) => c.fetchExportSeedPhraseRequest(...args)),
  fetchListAuthenticatorsRequest: (...args) => getApiClient().then((c) => c.fetchListAuthenticatorsRequest(...args)),
  fetchRegisterNewAuthenticatorRequest: (...args) =>
    getApiClient().then((c) => c.fetchRegisterNewAuthenticatorRequest(...args)),
  fetchDeleteAuthenticatorRequest: (...args) => getApiClient().then((c) => c.fetchDeleteAuthenticatorRequest(...args)),
}
