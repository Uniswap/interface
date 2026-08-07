/**
 * A Node `@walletconnect/sign-client` instance acting as the paired wallet counterparty for
 * hermetic WalletConnect e2e tests. It pairs with the web interface's `display_uri` over the
 * {@link ./localRelay} local relay, approves a session for the anvil test wallet, and answers
 * session requests:
 *  - `eth_sendTransaction`: forwarded to the local anvil node (which has the test wallet's key
 *    — anvil account #0 — unlocked), returning the broadcast tx hash.
 *  - `personal_sign` / `eth_signTypedData[_v4]`: signed locally with the anvil private key.
 *
 * Each SignClient gets its own in-memory storage so the counterparty never shares a relay
 * identity with the interface connector (that sharing is the INC-316 root cause this harness
 * exists to guard against).
 */
import { createWalletClient, type Hex, http, mainnet, privateKeyToAccount } from '@universe/chains'
import { SignClient } from '@walletconnect/sign-client'
import type { ProposalTypes, SignClientTypes } from '@walletconnect/types'
import { buildApprovedNamespaces } from '@walletconnect/utils'
import { TEST_WALLET_PRIVATE_KEY } from '~/playwright/anvil/anvil-manager'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
]
const SUPPORTED_EVENTS = ['chainChanged', 'accountsChanged']

interface KeyValueStorage {
  getKeys: () => Promise<string[]>
  getEntries: <T = unknown>() => Promise<[string, T][]>
  getItem: <T = unknown>(key: string) => Promise<T | undefined>
  setItem: <T = unknown>(key: string, value: T) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

function collectEip155Chains(proposal: ProposalTypes.Struct, fallbackChainId: number): string[] {
  const chains = new Set<string>([`eip155:${fallbackChainId}`])
  for (const namespaces of [proposal.requiredNamespaces, proposal.optionalNamespaces]) {
    // eip155 is absent when the interface requests no chains in that layer (indexed lookup
    // is non-nullish in the type but genuinely undefined over the wire).
    const eip155 = namespaces.eip155 as ProposalTypes.BaseRequiredNamespace | undefined
    for (const chain of eip155?.chains ?? []) {
      chains.add(chain)
    }
  }
  return [...chains]
}

function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, unknown>()
  return {
    getKeys: async () => [...store.keys()],
    getEntries: async () => [...store.entries()] as [string, never][],
    getItem: async (key) => store.get(key) as never,
    setItem: async (key, value) => {
      store.set(key, value)
    },
    removeItem: async (key) => {
      store.delete(key)
    },
  }
}

export interface WalletCounterparty {
  /** Pair with the interface's `display_uri` and approve the resulting session. */
  pairAndApprove: (uri: string) => Promise<{ sessionTopic: string }>
  close: () => Promise<void>
}

export async function createWalletCounterparty(params: {
  relayUrl: string
  projectId: string
  /** JSON-RPC url of the local anvil node that receives forwarded transactions. */
  anvilRpcUrl: string
  /** EVM chain id the session is scoped to (defaults to mainnet). */
  chainId?: number
}): Promise<WalletCounterparty> {
  const chainId = params.chainId ?? mainnet.id
  const account = privateKeyToAccount(TEST_WALLET_PRIVATE_KEY as Hex)
  const walletClient = createWalletClient({ account, chain: mainnet, transport: http(params.anvilRpcUrl) })

  const client = await SignClient.init({
    projectId: params.projectId,
    relayUrl: params.relayUrl,
    storage: createMemoryStorage(),
    customStoragePrefix: 'wcE2eCounterparty',
    metadata: {
      name: 'E2E Wallet Counterparty',
      description: 'Hermetic WalletConnect e2e wallet',
      url: 'https://e2e.local',
      icons: [],
    },
  })

  client.on('session_proposal', async (proposal: SignClientTypes.EventArguments['session_proposal']) => {
    // Approve every eip155 chain the interface requests (required + optional) with the single
    // test account — wagmi's connector lists all configured chains as optional namespaces, so a
    // hardcoded single-chain approval would fail buildApprovedNamespaces' conformance check.
    const requestedChains = collectEip155Chains(proposal.params, chainId)
    const namespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          chains: requestedChains,
          methods: SUPPORTED_METHODS,
          events: SUPPORTED_EVENTS,
          accounts: requestedChains.map((chain) => `${chain}:${TEST_WALLET_ADDRESS}`),
        },
      },
    })
    await client.approve({ id: proposal.id, namespaces })
  })

  client.on('session_request', async (event: SignClientTypes.EventArguments['session_request']) => {
    const { topic, id, params: requestParams } = event
    const { method, params: methodParams } = requestParams.request

    const respondResult = (result: unknown): Promise<void> =>
      client.respond({ topic, response: { id, jsonrpc: '2.0', result: result as string } })
    const respondError = (message: string): Promise<void> =>
      client.respond({ topic, response: { id, jsonrpc: '2.0', error: { code: -32000, message } } })

    try {
      switch (method) {
        case 'eth_sendTransaction':
        case 'eth_signTransaction': {
          // Anvil has the test wallet (account #0) unlocked, so forwarding the raw request
          // signs + broadcasts with the real key and returns the tx hash.
          const txHash = await walletClient.request({
            method: method as 'eth_sendTransaction',
            params: methodParams as never,
          })
          await respondResult(txHash)
          break
        }
        case 'personal_sign': {
          const [message] = methodParams as [Hex, string]
          await respondResult(await account.signMessage({ message: { raw: message } }))
          break
        }
        case 'eth_sign': {
          const [, message] = methodParams as [string, Hex]
          await respondResult(await account.signMessage({ message: { raw: message } }))
          break
        }
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4': {
          const [, typedData] = methodParams as [string, string]
          const parsed = typeof typedData === 'string' ? JSON.parse(typedData) : typedData
          await respondResult(await account.signTypedData(parsed))
          break
        }
        default:
          await respondError(`Unsupported method: ${method}`)
      }
    } catch (error) {
      await respondError(error instanceof Error ? error.message : 'counterparty request failed')
    }
  })

  return {
    async pairAndApprove(uri: string) {
      const { topic } = await client.core.pairing.pair({ uri })
      return { sessionTopic: topic }
    },
    async close() {
      try {
        await client.core.relayer.transportClose()
      } catch {
        // best-effort teardown
      }
    },
  }
}
