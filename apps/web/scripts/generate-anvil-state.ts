// oxlint-disable eslint-js/no-restricted-syntax -- Node-side script: process.env is the config surface here
/**
 * Generates the committed `--load-state` fixture for the anvil e2e fork.
 *
 * Boots anvil at the pinned mainnet fork (same argv as the Playwright manager, via
 * buildAnvilSpawnArgs), pre-bakes the test wallet's state, and dumps the resulting
 * local state overlay (`--dump-state` on shutdown) to
 * `src/playwright/anvil/state/mainnet-<pin>.json`:
 *
 * - ETH + ERC20 balances (USDC/DAI/USDT/WETH/WEETH) via VERIFIED storage writes
 * - ERC20 → Permit2 max approvals for USDC/DAI/WETH/WEETH
 * - USDT is warmed but left UNAPPROVED (approve(max) then approve(0)): the suite's
 *   approval-flow tests (LimitApprove, Swap permit tests, CreatePosition approval
 *   flow) assert the USDT approval UI and rely on a clean allowance
 * - a Permit2.approve(USDT, universal router, 0, 0) to pull Permit2's code+storage
 *   into the overlay (ends at zero allowance — behavior-neutral)
 * - the EIP-7702 zero-address delegation the delegateToZeroAddress fixture sends
 *   (delegating to address(0) clears code and bumps the nonce)
 *
 * Why: the dump contains the code + touched storage of every contract the runtime
 * funding helpers use, so with `--load-state` those ~40 per-test funding call sites
 * are served from the local overlay instead of refetching through the upstream fork
 * source on every relaunch. Tests still call the helpers — against preloaded state
 * they verify-and-no-op (or write locally) without upstream traffic.
 *
 * Run when the pin changes (fork-blocks.json): the fixture filename embeds the block
 * number, so a stale fixture simply stops being loaded (see resolveLoadStatePath).
 * scripts/bump-fork-blocks.ts (the weekly bump workflow's entry point) re-pins and
 * calls generateAnvilState in one go, so pins and fixture can't drift apart.
 *
 *   NODE_USE_ENV_PROXY=1 ANVIL_FORK_VIA_UNIRPC=1 bun scripts/generate-anvil-state.ts
 *
 * The script relaunches anvil with the fresh fixture afterwards and verifies every
 * baked balance/allowance before writing it into the tree.
 */
import { type ChildProcess, spawn } from 'child_process'
import { copyFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { MaxUint256, permit2Address } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion, WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import PERMIT2_ABI from 'uniswap/src/abis/permit2'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI as DAI_TOKEN, USDC_MAINNET, USDT as USDT_TOKEN } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import type { Address } from '~/chains'
import { erc20Abi } from '~/chains'
import {
  buildAnvilSpawnArgs,
  resolveForkChainDefaults,
  resolvePinnedForkBlock,
} from '~/playwright/anvil/anvil-args'
import { type AnvilClient, createAnvilClient, TEST_WALLET_PRIVATE_KEY } from '~/playwright/anvil/anvil-manager'
import type { AnvilForkSource } from '~/playwright/anvil/unirpc-fork'
import { resolveForkSourceProvider } from '~/playwright/anvil/unirpc-fork'
import {
  erc20BalanceRpcFromClient,
  knownBalanceSlotFor,
  ONE_MILLION_USDT,
  setVerifiedErc20Balance,
  WEETH_ADDRESS,
} from '~/playwright/anvil/utils'
import { assume0xAddress } from '~/utils/wagmi'

const CHAIN_ID = UniverseChainId.Mainnet
const PORT = 8560 // offset from 8545 so a running e2e anvil is never clobbered
const URL = `http://127.0.0.1:${PORT}`

// Canonical mainnet addresses, reused from their existing definitions (no local copies).
const PERMIT2 = assume0xAddress(permit2Address(CHAIN_ID))
const UNIVERSAL_ROUTER = assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, CHAIN_ID))
const USDC = assume0xAddress(USDC_MAINNET.address)
const DAI = assume0xAddress(DAI_TOKEN.address)
const USDT = assume0xAddress(USDT_TOKEN.address)
const WETH = assume0xAddress(WETH_ADDRESS(CHAIN_ID))
const WEETH = WEETH_ADDRESS

interface BakedToken {
  symbol: string
  address: Address
  balance: bigint
  /** ERC20 → Permit2 allowance the fixture ENDS with (undefined = approve is never sent). */
  finalPermit2Allowance: bigint | undefined
}

const MAX_UINT256 = MaxUint256.toBigInt()
const ETH_BALANCE = parseEther('10000')

const BAKED_TOKENS: BakedToken[] = [
  { symbol: 'USDC', address: USDC, balance: 1_000_000_000_000n, finalPermit2Allowance: MAX_UINT256 },
  { symbol: 'DAI', address: DAI, balance: 1_000_000n * 10n ** 18n, finalPermit2Allowance: MAX_UINT256 },
  // USDT ends UNAPPROVED on purpose — approval-flow tests assert the approve UI.
  { symbol: 'USDT', address: USDT, balance: ONE_MILLION_USDT, finalPermit2Allowance: 0n },
  { symbol: 'WETH', address: WETH, balance: parseEther('1000'), finalPermit2Allowance: MAX_UINT256 },
  { symbol: 'WEETH', address: WEETH, balance: parseEther('100'), finalPermit2Allowance: MAX_UINT256 },
]

const createClient = (): AnvilClient => createAnvilClient({ url: URL, timeout: 60_000 })

type Client = AnvilClient

async function waitForHealth(client: Client): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await client.getBlockNumber()
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error(`anvil at ${URL} never became healthy`)
}

function spawnAnvil(args: string[]): ChildProcess {
  const child = spawn('anvil', args, { stdio: ['ignore', 'ignore', 'inherit'] })
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`anvil exited with code ${code} (signal ${signal})`)
    }
  })
  return child
}

async function stopAnvil(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) {
    return
  }
  const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()))
  child.kill('SIGTERM')
  await exited
}

async function bakeState(client: Client): Promise<void> {
  const wallet = privateKeyToAccount(TEST_WALLET_PRIVATE_KEY).address

  await client.setBalance({ address: wallet, value: ETH_BALANCE })

  for (const token of BAKED_TOKENS) {
    const slot = await setVerifiedErc20Balance({
      rpc: erc20BalanceRpcFromClient(client),
      erc20Address: token.address,
      user: wallet,
      newBalance: token.balance,
      knownSlot: knownBalanceSlotFor(token.address),
    })
    console.log(`[state] ${token.symbol}: balance ${token.balance} baked (slot ${slot})`)

    if (token.finalPermit2Allowance === undefined) {
      continue
    }
    // approve(max) first even when the final allowance is 0: the tx pulls the token's
    // full approve code path into the overlay, and USDT requires a reset-to-zero
    // before any non-zero approve anyway.
    for (const amount of token.finalPermit2Allowance === 0n ? [MAX_UINT256, 0n] : [token.finalPermit2Allowance]) {
      const hash = await client.writeContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PERMIT2, amount],
        account: wallet,
        chain: mainnet,
      })
      await client.waitForTransactionReceipt({ hash })
    }
    console.log(`[state] ${token.symbol}: Permit2 allowance ends at ${token.finalPermit2Allowance}`)
  }

  // Pull Permit2's code + an allowance slot into the overlay; amount/expiration 0
  // reads back as "no allowance", so the app's permit flows are unaffected.
  const permit2Hash = await client.writeContract({
    address: PERMIT2,
    abi: PERMIT2_ABI,
    functionName: 'approve',
    args: [USDT, UNIVERSAL_ROUTER, 0n, 0],
    account: wallet,
    chain: mainnet,
  })
  await client.waitForTransactionReceipt({ hash: permit2Hash })
  console.log('[state] Permit2 warmed (zero allowance record)')

  // The EIP-7702 zero-address delegation the delegateToZeroAddress fixture sends
  // before every test — baked in so the fixture's tx replays entirely locally.
  // NOTE: signAuthorization needs the LOCAL account object — an address string
  // parses as a json-rpc account, which cannot sign authorizations.
  const nonce = await client.getTransactionCount({ address: wallet })
  const authorization = await client.signAuthorization({
    account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
    contractAddress: ZERO_ADDRESS,
    chainId: CHAIN_ID,
    nonce: nonce + 1,
  })
  const delegationHash = await client.sendTransaction({
    authorizationList: [authorization],
    to: wallet,
    account: wallet,
    chain: mainnet,
  })
  await client.waitForTransactionReceipt({ hash: delegationHash })
  await client.setBalance({ address: wallet, value: ETH_BALANCE })
  console.log('[state] EIP-7702 zero-address delegation baked')
}

async function verifyState(client: Client): Promise<void> {
  const wallet = privateKeyToAccount(TEST_WALLET_PRIVATE_KEY).address

  const ethBalance = await client.getBalance({ address: wallet })
  if (ethBalance !== ETH_BALANCE) {
    throw new Error(`verify: ETH balance ${ethBalance} != ${ETH_BALANCE}`)
  }

  for (const token of BAKED_TOKENS) {
    const balance = await client.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet],
    })
    if (balance !== token.balance) {
      throw new Error(`verify: ${token.symbol} balance ${balance} != ${token.balance}`)
    }
    if (token.finalPermit2Allowance !== undefined) {
      const allowance = await client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [wallet, PERMIT2],
      })
      if (allowance !== token.finalPermit2Allowance) {
        throw new Error(`verify: ${token.symbol} Permit2 allowance ${allowance} != ${token.finalPermit2Allowance}`)
      }
    }
    console.log(`[verify] ${token.symbol} OK`)
  }

  const nonce = await client.getTransactionCount({ address: wallet })
  if (nonce === 0) {
    throw new Error('verify: wallet nonce is 0 — the baked transactions are missing from the loaded state')
  }
  console.log(`[verify] wallet nonce ${nonce}, ETH balance OK`)
}

/**
 * Bakes + verifies the loadState fixture. `forkBlockNumber` defaults to the checked-in
 * mainnet pin; bump-fork-blocks.ts passes the pin explicitly because fork-blocks.json
 * is a static import (anvil-args.ts), so a pin written earlier in the same process
 * would not be visible here.
 */
export async function generateAnvilState(options: { forkBlockNumber?: number } = {}): Promise<void> {
  const forkBlockNumber = options.forkBlockNumber ?? resolvePinnedForkBlock({ chainId: CHAIN_ID })
  if (forkBlockNumber === undefined) {
    throw new Error('mainnet has no pinned fork block — a state fixture must be dumped at a pin')
  }

  const chainDefaults = resolveForkChainDefaults({ chainId: CHAIN_ID })
  const provider = resolveForkSourceProvider({ defaultForkUrl: chainDefaults.forkUrl, chainId: CHAIN_ID })
  const forkSource: AnvilForkSource = await provider.getForkSource()

  const outputDir = path.join(__dirname, '..', 'src', 'playwright', 'anvil', 'state')
  const outputPath = path.join(outputDir, `mainnet-${forkBlockNumber}.json`)
  const dumpPath = path.join(tmpdir(), `anvil-state-mainnet-${forkBlockNumber}.tmp.json`)
  if (existsSync(dumpPath)) {
    unlinkSync(dumpPath)
  }

  const spawnArgs = (loadStatePath?: string) =>
    buildAnvilSpawnArgs({
      forkSource,
      forkBlockNumber,
      loadStatePath,
      port: PORT,
      host: '127.0.0.1',
      verbose: false,
    })

  console.log(`[state] forking ${forkSource.forkUrl} at block ${forkBlockNumber} on :${PORT}...`)
  const generator = spawnAnvil([...spawnArgs(), '--dump-state', dumpPath])
  try {
    const client = createClient()
    await waitForHealth(client)
    await bakeState(client)
  } finally {
    await stopAnvil(generator) // --dump-state writes on graceful shutdown
  }

  if (!existsSync(dumpPath)) {
    throw new Error(`anvil did not dump state to ${dumpPath}`)
  }
  const dumpBytes = statSync(dumpPath).size
  console.log(`[state] dumped ${dumpBytes} bytes`)

  // Relaunch WITH the fresh dump and verify every baked fact before committing it
  // to the tree — a fixture that doesn't load or misses state must never land.
  console.log('[state] relaunching with --load-state to verify the fixture...')
  const verifier = spawnAnvil([...spawnArgs(dumpPath)])
  try {
    const client = createClient()
    await waitForHealth(client)
    await verifyState(client)
  } finally {
    await stopAnvil(verifier)
  }

  mkdirSync(outputDir, { recursive: true })
  copyFileSync(dumpPath, outputPath) // copy (not rename): tmpdir may be a different filesystem
  unlinkSync(dumpPath)
  console.log(`[state] wrote ${outputPath} (${dumpBytes} bytes)`)
}

if (import.meta.main) {
  generateAnvilState().catch((error) => {
    console.error('generate-anvil-state failed:', error)
    process.exit(1)
  })
}
