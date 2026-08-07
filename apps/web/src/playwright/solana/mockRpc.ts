// oxlint-disable-next-line no-restricted-imports -- Playwright mock helpers need Playwright's Page type
import type { Page } from '@playwright/test'
import { getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Mock Solana JSON-RPC node for e2e tests.
 *
 * The swap form's balances (and its insufficient-funds warning) come from on-chain lookups
 * (`getOnChainBalancesFetchSVM` in packages/uniswap/src/features/portfolio/api.ts): `getBalance`
 * for native SOL and `getTokenAccountsByOwner` (jsonParsed) for SPL tokens. There is no Solana
 * equivalent of Anvil in this suite, so those RPC calls are answered from a static fixture.
 */

const LAMPORTS_PER_SIGNATURE_RENT = 2_039_280
const MOCK_BLOCKHASH = 'cGfHiC6Kgg3FpFZvgwGcswsCRtp4aBP2fzuXRQPizuN'
// Primary SPL token program (`TokenkegQ...`); mocked token accounts are served under it.
const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

export type SolanaRpcMockOptions = {
  ownerAddress: string
  solBalanceLamports: bigint
  /** Raw (integer) SPL balances keyed by mint address. */
  splBalancesByMint?: Record<string, { amount: string; decimals: number }>
}

type JsonRpcRequest = {
  id: number | string
  jsonrpc: string
  method: string
  params?: unknown[]
}

function buildTokenAccounts({
  ownerAddress,
  splBalancesByMint,
}: Pick<SolanaRpcMockOptions, 'ownerAddress' | 'splBalancesByMint'>): unknown[] {
  return Object.entries(splBalancesByMint ?? {}).map(([mint, { amount, decimals }]) => {
    const uiAmount = Number(amount) / 10 ** decimals
    return {
      pubkey: mint, // arbitrary unique account key; the client only reads parsed info
      account: {
        data: {
          program: 'spl-token',
          parsed: {
            type: 'account',
            info: {
              isNative: false,
              mint,
              owner: ownerAddress,
              state: 'initialized',
              tokenAmount: {
                amount,
                decimals,
                uiAmount,
                uiAmountString: String(uiAmount),
              },
            },
          },
          space: 165,
        },
        executable: false,
        lamports: LAMPORTS_PER_SIGNATURE_RENT,
        owner: SPL_TOKEN_PROGRAM_ID,
        rentEpoch: 0,
        space: 165,
      },
    }
  })
}

function buildRpcResult({ request, options }: { request: JsonRpcRequest; options: SolanaRpcMockOptions }): unknown {
  const context = { apiVersion: '1.18.0', slot: 1 }

  switch (request.method) {
    case 'getBalance':
      return { context, value: Number(options.solBalanceLamports) }
    case 'getTokenAccountsByOwner': {
      const requestedProgramId = (request.params?.[1] as { programId?: string } | undefined)?.programId
      const value =
        requestedProgramId === SPL_TOKEN_PROGRAM_ID
          ? buildTokenAccounts({ ownerAddress: options.ownerAddress, splBalancesByMint: options.splBalancesByMint })
          : []
      return { context, value }
    }
    case 'getLatestBlockhash':
      return { context, value: { blockhash: MOCK_BLOCKHASH, lastValidBlockHeight: 999_999_999 } }
    case 'getVersion':
      return { 'solana-core': '1.18.0', 'feature-set': 0 }
    default:
      return undefined
  }
}

// Playwright's config loader (loadTestRunnerEnv) mirrors the browser bundle's env, so the
// runner-side getQuicknodeEndpointUrl resolves the same endpoint the app will call. The
// static QuickNode pattern is kept as a fallback in case the two ever diverge.
function isSolanaRpcHost(url: URL): boolean {
  try {
    if (url.hostname === new URL(getQuicknodeEndpointUrl(UniverseChainId.Solana)).hostname) {
      return true
    }
  } catch {
    // Unresolvable runner-side config — rely on the static pattern below.
  }
  return url.hostname.endsWith('solana-mainnet.quiknode.pro')
}

/**
 * Intercepts the app's Solana JSON-RPC endpoint (`getQuicknodeEndpointUrl(Solana)`) and serves
 * deterministic balances. The matcher targets the concrete configured endpoint — not a loose
 * hostname substring — so an endpoint change breaks loudly here instead of silently leaking
 * requests to the live node. Unknown methods get a JSON-RPC error so unexpected calls fail
 * fast instead of hanging on blocked egress.
 */
export async function installSolanaRpcMock(page: Page, options: SolanaRpcMockOptions): Promise<void> {
  await page.route(
    (url: URL): boolean => isSolanaRpcHost(url),
    async (route) => {
      const request = route.request()
      if (request.method() !== 'POST') {
        await route.fulfill({ status: 404, body: '' })
        return
      }

      const payload = request.postDataJSON() as JsonRpcRequest | JsonRpcRequest[]
      const requests = Array.isArray(payload) ? payload : [payload]

      const responses = requests.map((rpcRequest) => {
        const result = buildRpcResult({ request: rpcRequest, options })
        return result === undefined
          ? {
              jsonrpc: '2.0',
              id: rpcRequest.id,
              error: { code: -32601, message: `solana rpc mock: method not mocked: ${rpcRequest.method}` },
            }
          : { jsonrpc: '2.0', id: rpcRequest.id, result }
      })

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(Array.isArray(payload) ? responses : responses[0]),
      })
    },
  )
}
