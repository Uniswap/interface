import type { BrowserContext, Route } from '@playwright/test'
import type { TradingApi } from '@universe/api'
import { FeatureFlagClient, FeatureFlags, getFeatureFlagName } from '@universe/gating'

/** Matches any gateway host and any API version prefix (`/v1/`, `/v2/`, or a non-prod override). */
const CHECK_DELEGATION_URL_GLOB = '**/wallet/check_delegation'

/** A plain EOA: nothing delegated, and no delegation address to upgrade to. */
const NO_DELEGATION: TradingApi.DelegationDetails = {
  isWalletDelegatedToUniswap: false,
  currentDelegationAddress: null,
  latestDelegationAddress: '',
}

interface CheckDelegationRequestBody {
  walletAddresses?: string[]
  chainIds?: number[]
}

/** Echoes back the requested addresses and chains so the mock can't drift from what the app asks for. */
function buildNoDelegationResponse(route: Route): TradingApi.WalletCheckDelegationResponseBody {
  const postData = route.request().postData()
  const requestBody: CheckDelegationRequestBody = postData ? (JSON.parse(postData) as CheckDelegationRequestBody) : {}
  const { walletAddresses = [], chainIds = [] } = requestBody

  const delegationDetails: TradingApi.WalletCheckDelegationResponseBody['delegationDetails'] = {}
  for (const walletAddress of walletAddresses) {
    delegationDetails[walletAddress] = Object.fromEntries(chainIds.map((chainId) => [String(chainId), NO_DELEGATION]))
  }

  return { requestId: 'e2e-no-delegation', delegationDetails }
}

/**
 * Answers `wallet/check_delegation` with "no delegation on any requested chain", for every page in
 * the context.
 *
 * The suite onboards the public Hardhat/Anvil dev mnemonic, and those addresses carry real
 * third-party EIP-7702 delegations on the production gateway. Left live, the wallet reads that as a
 * delegation conflict and covers the home screen with the "Smart wallet features unavailable"
 * modal, which swallows a test's first click. The empty `latestDelegationAddress` matters too:
 * onboarding grants smart-wallet consent, so an upgradeable-but-undelegated wallet would get the
 * upgrade nudge modal instead, and swaps would take the 7702 path.
 */
export async function mockNoWalletDelegation(context: BrowserContext): Promise<void> {
  await context.route(CHECK_DELEGATION_URL_GLOB, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(buildNoDelegationResponse(route)) })
  })
}

const STATSIG_INITIALIZE_URL_GLOB = '**/statsig-proxy/initialize*'

/** Gates the suite can't run without. Keyed by plain name: the SDK looks names up before their DJB2 hash. */
function buildFallbackStatsigInitializeResponse(): Record<string, unknown> {
  const hashcashGate = getFeatureFlagName(FeatureFlags.HashcashSolverEnabled, FeatureFlagClient.Wallet)
  return {
    has_updates: true,
    hash_used: 'none',
    time: Date.now(),
    feature_gates: {
      [hashcashGate]: { name: hashcashGate, value: true, rule_id: 'e2e-fallback', secondary_exposures: [] },
    },
    dynamic_configs: {},
    layer_configs: {},
  }
}

/**
 * Passes Statsig `initialize` through, but answers a failed one (CI runners get throttled with 429s) with
 * the hashcash solver gate on. Without it the mock solver runs, `Verify` rejects it, and every session-gated call 401s.
 */
export async function mockStatsigInitializeFallback(context: BrowserContext): Promise<void> {
  await context.route(STATSIG_INITIALIZE_URL_GLOB, async (route) => {
    const response = await route.fetch().catch(() => undefined)
    if (response?.ok()) {
      await route.fulfill({ response })
      return
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(buildFallbackStatsigInitializeResponse()),
    })
  })
}
