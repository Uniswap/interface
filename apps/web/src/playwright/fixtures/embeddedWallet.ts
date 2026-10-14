import { EmbeddedWalletService } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_connect'
import { Action } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { privateKeyToAccount } from '@universe/chains'
import type { HexString } from '@universe/encoding'
import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { assume0xAddress } from '~/chains'
import { TEST_WALLET_PRIVATE_KEY } from '~/playwright/anvil/anvil-manager'
import type { Page, Route } from '~/playwright/fixtures'
import { seedEmbeddedWalletState } from '~/playwright/fixtures/account'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

/**
 * Embedded wallet (EW) harness. Answers every EmbeddedWalletService RPC at the network boundary
 * (WebAuthn mocked, NECK session active, signing done locally with the anvil key) so the app runs its
 * real ceremony and broadcasts to anvil. It proves the app performs the ceremony, not that the
 * service would accept it.
 */

const TEST_EMBEDDED_WALLET_ID = 'test-wallet-id'

/** `eagerlyConnect=embedded` makes the e2e bootstrap connect the EW connector (see setupWagmiAutoConnect). */
export const EMBEDDED_WALLET_URL_PARAMS = `featureFlagOverride=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}&eagerlyConnect=embedded`

type Rpc = keyof typeof EmbeddedWalletService.methods
type RpcName = (typeof EmbeddedWalletService.methods)[Rpc]['name']

function rpcUrl(rpc: Rpc): string {
  return `**/${EmbeddedWalletService.typeName}/${EmbeddedWalletService.methods[rpc].name}`
}

/** Device-session actions that sign something; `neckSession: 'expiredOnce'` expires exactly one of these. */
const SIGNING_ACTIONS = new Set(
  [
    Action.SIGN_TRANSACTION,
    Action.SIGN_TYPED_DATA,
    Action.SIGN_MESSAGE,
    Action.SIGN_7702_AUTHORIZATION,
    Action.SIGN_7702_TRANSACTION,
  ].map((action) => Action[action]),
)

/** Actions the client completes with the NECK device key; every other action runs the passkey ceremony. */
const DEVICE_SESSION_ACTIONS = new Set([
  ...SIGNING_ACTIONS,
  Action[Action.LIST_AUTHENTICATORS],
  Action[Action.DISCONNECT],
])

const PASSKEY_CHALLENGE = {
  challengeOptions: JSON.stringify({
    challenge: 'dGVzdC1jaGFsbGVuZ2U',
    timeout: 60000,
    rpId: 'localhost',
    allowCredentials: [{ id: 'Y3JlZC1pY2xvdWQtMQ', type: 'public-key' }],
    userVerification: 'required',
  }),
}
const ACTIVE_SESSION_CHALLENGE = { sessionActive: true, signingPayload: 'dGVzdC1zaWduaW5nLXBheWxvYWQ' }
const EXPIRED_SESSION_CHALLENGE = { sessionActive: false }

type LocalAccount = ReturnType<typeof privateKeyToAccount>
type TypedDataPayload = Parameters<LocalAccount['signTypedData']>[0]

export interface EmbeddedWalletHarness {
  account: LocalAccount
  /** Every EW RPC the app made, in order; Challenge entries carry the action. */
  rpcCalls: { rpc: RpcName; action?: string; body: Record<string, unknown> }[]
  signedTypedData: { typedData: TypedDataPayload; signature: HexString }[]
  signedTransactions: HexString[]
}

const LIST_AUTHENTICATORS = EmbeddedWalletService.methods.listAuthenticators.name
const LIST_AUTHENTICATORS_ACTION = Action[Action.LIST_AUTHENTICATORS]

/**
 * `Challenge:SIGN_TRANSACTION`, `SignTransaction`, ... for ordering assertions. The app lists
 * authenticators in the background after a transaction; that traffic is not part of any ceremony.
 */
export function rpcSequence(harness: EmbeddedWalletHarness): string[] {
  return harness.rpcCalls
    .filter((call) => call.rpc !== LIST_AUTHENTICATORS && call.action !== LIST_AUTHENTICATORS_ACTION)
    .map((call) => (call.action ? `${call.rpc}:${call.action}` : call.rpc))
}

type DelegationDetails = {
  isWalletDelegatedToUniswap: boolean
  currentDelegationAddress: string | null
  latestDelegationAddress: string
}
type DelegationDetailsByChain = Record<string, Record<string, DelegationDetails>>

interface SetupEmbeddedWalletOptions {
  /** `expiredOnce` fails the first signing challenge so the client re-runs the passkey ceremony before signing. */
  neckSession?: 'active' | 'expiredOnce'
  /** `check_delegation` details by wallet address then chain id; none forces the standard (non-7702) path. */
  delegationDetails?: DelegationDetailsByChain
}

function recordRpc<T extends Record<string, unknown>>({
  harness,
  rpc,
  route,
}: {
  harness: EmbeddedWalletHarness
  rpc: Rpc
  route: Route
}): T {
  const body = (route.request().postDataJSON() ?? {}) as T
  const action = rpc === 'challenge' && typeof body.action === 'string' ? body.action : undefined
  harness.rpcCalls.push({ rpc: EmbeddedWalletService.methods[rpc].name, action, body })
  return body
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
}

async function setupWebAuthnMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const emptyBuf = new Uint8Array([0]).buffer
    const credential = {
      id: 'cred-icloud-1',
      rawId: emptyBuf,
      type: 'public-key' as const,
      authenticatorAttachment: 'platform' as const,
      getClientExtensionResults: () => ({}),
      response: { clientDataJSON: emptyBuf, authenticatorData: emptyBuf, signature: emptyBuf, userHandle: null },
    }
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: async () => credential, create: async () => credential, preventSilentAccess: async () => {} },
    })
  })
}

async function setupNeckMocks({
  page,
  harness,
  neckSession,
}: {
  page: Page
  harness: EmbeddedWalletHarness
  neckSession: SetupEmbeddedWalletOptions['neckSession']
}): Promise<void> {
  let expireNextSigningChallenge = neckSession === 'expiredOnce'
  await Promise.all([
    page.route(rpcUrl('walletSignIn'), async (route) => {
      recordRpc({ harness, rpc: 'walletSignIn', route })
      await fulfillJson(route, {})
    }),
    page.route(rpcUrl('challenge'), async (route) => {
      const { action } = recordRpc<{ action?: string }>({ harness, rpc: 'challenge', route })
      if (!action || !DEVICE_SESSION_ACTIONS.has(action)) {
        await fulfillJson(route, PASSKEY_CHALLENGE)
      } else if (expireNextSigningChallenge && SIGNING_ACTIONS.has(action)) {
        expireNextSigningChallenge = false
        await fulfillJson(route, EXPIRED_SESSION_CHALLENGE)
      } else {
        await fulfillJson(route, ACTIVE_SESSION_CHALLENGE)
      }
    }),
  ])
}

interface SerializedTransactionRequest {
  to?: string
  data?: string
  value?: string
  chainId: number | string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gas: string
  nonce: number | string
}

async function setupSigningMocks(page: Page, harness: EmbeddedWalletHarness): Promise<void> {
  await Promise.all([
    // The provider forwards the result straight to sendRawTransaction, so it must be a full serialized tx.
    page.route(rpcUrl('signTransaction'), async (route) => {
      const { transaction } = recordRpc<{ transaction: string }>({ harness, rpc: 'signTransaction', route })
      const tx = JSON.parse(transaction) as SerializedTransactionRequest
      const signature = await harness.account.signTransaction({
        to: tx.to ? assume0xAddress(tx.to) : undefined,
        data: (tx.data ?? '0x') as HexString,
        value: BigInt(tx.value ?? '0'),
        chainId: Number(tx.chainId),
        maxFeePerGas: BigInt(tx.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
        gas: BigInt(tx.gas),
        nonce: Number(tx.nonce),
        type: 'eip1559',
      })
      harness.signedTransactions.push(signature)
      await fulfillJson(route, { signature })
    }),
    page.route(rpcUrl('signTypedData'), async (route) => {
      const { typedData } = recordRpc<{ typedData: string }>({ harness, rpc: 'signTypedData', route })
      const parsed = JSON.parse(typedData) as TypedDataPayload
      const signature = await harness.account.signTypedData(parsed)
      harness.signedTypedData.push({ typedData: parsed, signature })
      await fulfillJson(route, { signature })
    }),
    page.route(rpcUrl('signMessage'), async (route) => {
      const { message } = recordRpc<{ message: string }>({ harness, rpc: 'signMessage', route })
      // personal_sign passes the message through hex-encoded; sign its bytes, not the hex text.
      const signature = await harness.account.signMessage({
        message: /^0x[0-9a-fA-F]*$/.test(message) ? { raw: message as HexString } : message,
      })
      await fulfillJson(route, { signature })
    }),
    page.route(rpcUrl('listAuthenticators'), async (route) => {
      recordRpc({ harness, rpc: 'listAuthenticators', route })
      await fulfillJson(route, { authenticators: [], recoveryMethods: [] })
    }),
  ])
}

async function stubCheckDelegation(page: Page, delegationDetails: DelegationDetailsByChain = {}): Promise<void> {
  await page.route('**/wallet/check_delegation', async (route) => {
    await fulfillJson(route, { requestId: '', delegationDetails })
  })
}

/** Call before `page.goto`, and append {@link EMBEDDED_WALLET_URL_PARAMS} to the URL. */
export async function setupEmbeddedWallet(
  page: Page,
  options: SetupEmbeddedWalletOptions = {},
): Promise<EmbeddedWalletHarness> {
  const harness: EmbeddedWalletHarness = {
    account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
    rpcCalls: [],
    signedTypedData: [],
    signedTransactions: [],
  }
  await Promise.all([
    seedEmbeddedWalletState({ page, walletId: TEST_EMBEDDED_WALLET_ID, walletAddress: TEST_WALLET_ADDRESS }),
    setupWebAuthnMock(page),
    setupNeckMocks({ page, harness, neckSession: options.neckSession }),
    setupSigningMocks(page, harness),
    stubCheckDelegation(page, options.delegationDetails),
  ])
  return harness
}
