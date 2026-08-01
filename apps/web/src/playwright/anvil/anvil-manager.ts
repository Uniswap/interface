// oxlint-disable eslint-js/no-restricted-syntax
import { type ChildProcess, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { promiseTimeout, sleep } from 'utilities/src/time/timing'
import { createClient, createTestClient, http, publicActions, walletActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { loadTestRunnerEnv } from '../../../vite/resolveEnvConfigs'
import {
  buildAnvilSpawnArgs,
  buildResetForkParams,
  isAnvilVerbose,
  resolveForkChainDefaults,
  resolveLoadStatePath,
  resolvePinnedForkBlock,
} from '~/playwright/anvil/anvil-args'
import { killExistingProcess, removeAnvilPidFile, writeAnvilPidFile } from '~/playwright/anvil/anvil-process'
import { clockSyncRpcFromClient, syncClockToWallClock } from '~/playwright/anvil/clock-sync'
import type { AnvilForkSource, ForkSourceProvider } from '~/playwright/anvil/unirpc-fork'
import { probeForkAuth, resolveForkSourceProvider, shouldRelaunchForAuth } from '~/playwright/anvil/unirpc-fork'

loadTestRunnerEnv(process.cwd())

/** anvil's well-known dev account 0 — the e2e test wallet (also scripts/generate-anvil-state.ts). */
export const TEST_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

interface AnvilConfig {
  port: number
  host: string
  /** Async fork-source seam: resolved fresh on every (re)launch, so relaunches pick up refreshed credentials. */
  forkSource: ForkSourceProvider
  /** Pinned fork block for deterministic chain state (see anvil-args.ts). Undefined forks at the tip. */
  forkBlockNumber: number | undefined
  /**
   * Committed `--load-state` fixture (pre-funded test wallet at the pin — see
   * scripts/generate-anvil-state.ts). Undefined when no fixture matches the pin;
   * runtime funding then does all the work.
   */
  loadStatePath: string | undefined
  /** Opt-in debug output (`--print-traces` + `RUST_LOG=debug`) via ANVIL_VERBOSE. */
  verbose: boolean
  timeout: number
  logFile: string
}

interface HealthCheckResult {
  healthy: boolean
  blockNumber?: bigint
  error?: string
  responseTime?: number
}

interface AnvilManager {
  start(): Promise<void>
  stop(): Promise<void>
  restart(): Promise<boolean>
  isHealthy(): Promise<boolean>
  ensureHealthy(): Promise<boolean>
  checkHealth(): Promise<HealthCheckResult>
  /**
   * Full `anvil_reset` back to the launch state: same upstream fork source, same
   * pinned block. Drops ALL snapshots — recovery only, never routine cleanup
   * (see fixtures/anvil.ts for the snapshot/revert lifecycle this backs).
   */
  resetFork(): Promise<void>
  getClient(): AnvilClient
  getUrl(): string
}

const MAINNET_CHAIN_ID = 1

/**
 * Anvil forks the static per-chain default (PublicNode; override via ANVIL_FORK_URL,
 * see ~/playwright/anvil/anvil-args.ts), or — opt-in via ANVIL_FORK_VIA_UNIRPC=1 —
 * the uni RPC entry gateway with session fork-headers (see
 * ~/playwright/anvil/unirpc-fork.ts; without a session uni RPC 401s fork requests).
 * Whatever the source, the fork block is pinned for deterministic chain state.
 */
function buildAnvilConfig(overrides?: Partial<AnvilConfig>): AnvilConfig {
  return {
    port: overrides?.port ?? parseInt(process.env.ANVIL_PORT ?? '8545'),
    host: overrides?.host ?? '127.0.0.1',
    forkSource:
      overrides?.forkSource ??
      resolveForkSourceProvider({
        defaultForkUrl: resolveForkChainDefaults({ chainId: MAINNET_CHAIN_ID }).forkUrl,
        chainId: MAINNET_CHAIN_ID,
      }),
    forkBlockNumber: overrides?.forkBlockNumber ?? resolvePinnedForkBlock({ chainId: MAINNET_CHAIN_ID }),
    loadStatePath:
      overrides?.loadStatePath ??
      resolveLoadStatePath({
        chainId: MAINNET_CHAIN_ID,
        forkBlockNumber: overrides?.forkBlockNumber ?? resolvePinnedForkBlock({ chainId: MAINNET_CHAIN_ID }),
      }),
    verbose: overrides?.verbose ?? isAnvilVerbose(),
    // Generous: a health check can queue behind a slow upstream fork fetch (cold RPC
    // cache, slow gateway) — a premature timeout here used to trigger disruptive restarts.
    timeout: overrides?.timeout ?? 30_000,
    logFile: overrides?.logFile ?? path.join(process.cwd(), `anvil-test-${process.pid}.log`),
  }
}

export type AnvilClient = ReturnType<typeof createTestClient> &
  ReturnType<typeof publicActions> &
  ReturnType<typeof walletActions>

/**
 * Create an Anvil client for interacting with the local node.
 * Exported for standalone node scripts (see scripts/generate-anvil-state.ts).
 */
export function createAnvilClient(ctx: { url: string; timeout?: number }): AnvilClient {
  return createTestClient({
    account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
    chain: mainnet,
    mode: 'anvil',
    transport: http(ctx.url, {
      timeout: ctx.timeout,
      retryCount: 1,
      retryDelay: 500,
    }),
  })
    .extend(publicActions)
    .extend(walletActions)
}

/**
 * Create an Anvil manager instance with lazy configuration
 */
function createAnvilManager(configOverrides?: Partial<AnvilConfig>): AnvilManager {
  // State managed in closure
  let childProcess: ChildProcess | null = null
  let config: AnvilConfig | null = null
  let isRestarting = false
  // Fork source used by the running anvil process — probed at test boundaries so an
  // expired upstream session (401) can be detected and fixed with a relaunch.
  let activeForkSource: AnvilForkSource | null = null
  // A healthy anvil this process never spawned (a previous worker's survivor) has
  // unknown chain state — it gets one resetFork() before first use, tracked here.
  let adoptedExternalAnvil = false

  // NOTE: recovery happens ONLY at test boundaries via ensureHealthy(). There is
  // deliberately no background health monitor: a slow health check mid-test used to
  // auto-restart anvil, silently invalidating every live snapshot ID and breaking
  // snapshot/revert test isolation (the reason snapshots were once disabled).

  // Lazy config getter
  const getConfig = (): AnvilConfig => {
    if (!config) {
      config = buildAnvilConfig(configOverrides)
    }
    return config
  }

  // Check health implementation
  const checkHealth = async (): Promise<HealthCheckResult> => {
    const cfg = getConfig()
    const url = `http://${cfg.host}:${cfg.port}`
    const client = createClient({
      chain: mainnet,
      transport: http(url, {
        timeout: cfg.timeout,
        retryCount: 1,
        retryDelay: 500,
      }),
    }).extend(publicActions)

    const startTime = Date.now()

    try {
      const blockNumber = await promiseTimeout(client.getBlockNumber(), cfg.timeout)
      if (!blockNumber) {
        throw new Error('Anvil health check timed out')
      }
      const responseTime = Date.now() - startTime

      return {
        healthy: true,
        blockNumber,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      }
    }
  }

  // Wait for health with exponential backoff
  const waitForHealth = async (
    options: { maxAttempts?: number; initialDelay?: number; maxDelay?: number } = {},
  ): Promise<boolean> => {
    const { maxAttempts = 10, initialDelay = 1000, maxDelay = 10000 } = options

    let delay = initialDelay

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await checkHealth()

      if (result.healthy) {
        console.log(`Anvil is healthy (block: ${result.blockNumber}, response time: ${result.responseTime}ms)`)
        return true
      }

      console.warn(`Anvil health check failed (attempt ${attempt + 1}/${maxAttempts}): ${result.error}`)

      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.min(delay * 2, maxDelay)
      }
    }

    return false
  }

  // Create the manager object
  const manager: AnvilManager = {
    async start(): Promise<void> {
      const cfg = getConfig()

      if (childProcess) {
        console.log('Anvil is already running')
        return
      }

      console.log(`Starting Anvil on port ${cfg.port}...`)

      // Resolve the fork source before spawning: with uni RPC forking enabled this
      // bootstraps (or reuses) a session and yields the auth fork-headers.
      const forkSource = await cfg.forkSource.getForkSource()
      activeForkSource = forkSource

      // Kill any existing process on the port
      killExistingProcess(cfg.port)

      // Prepare log file
      const logStream = fs.createWriteStream(cfg.logFile, { flags: 'a' })

      // Start Anvil process
      childProcess = spawn(
        'anvil',
        buildAnvilSpawnArgs({
          forkSource,
          forkBlockNumber: cfg.forkBlockNumber,
          loadStatePath: cfg.loadStatePath,
          port: cfg.port,
          host: cfg.host,
          verbose: cfg.verbose,
        }),
        {
          env: { ...process.env, ...(cfg.verbose ? { RUST_LOG: 'debug' } : {}) },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )

      // Pipe output to log file
      if (childProcess.stdout) {
        childProcess.stdout.pipe(logStream)
      }
      if (childProcess.stderr) {
        childProcess.stderr.pipe(logStream)
      }

      // Record the PID so global teardown (a different process) can kill this anvil.
      if (childProcess.pid !== undefined) {
        writeAnvilPidFile({ port: cfg.port, pid: childProcess.pid })
      }

      // Handle process exit. Guard against a stale handler: a restart may have
      // replaced `childProcess` with a new spawn by the time the old one exits.
      const spawnedProcess = childProcess
      spawnedProcess.on('exit', (code, signal) => {
        console.log(`Anvil process exited with code ${code} and signal ${signal}`)
        if (childProcess === spawnedProcess) {
          childProcess = null
        }
      })

      // Wait for Anvil to be ready
      const ready = await waitForHealth({
        maxAttempts: 30,
        initialDelay: 1000,
      })

      if (!ready) {
        throw new Error('Anvil failed to start')
      }

      // The pinned fork boots hours behind wall clock; anchor node time to now so
      // wall-clock-stamped quotes (e.g. Across bridge) don't revert on-chain.
      await syncClockToWallClock(clockSyncRpcFromClient(manager.getClient()))

      console.log('Anvil is ready and accepting connections')
    },

    async stop(): Promise<void> {
      // Take ownership of the reference first: the exit handler nulls `childProcess`
      // when SIGTERM lands, so re-reading it after the grace sleep used to throw.
      const processToStop = childProcess
      childProcess = null
      activeForkSource = null

      if (!processToStop) {
        return
      }

      console.log('Stopping Anvil...')
      processToStop.kill('SIGTERM')

      // Give it time to shut down gracefully
      await sleep(2000)

      // Force kill if still running
      if (processToStop.exitCode === null && processToStop.signalCode === null) {
        processToStop.kill('SIGKILL')
      }

      removeAnvilPidFile(getConfig().port)
    },

    async restart(): Promise<boolean> {
      if (isRestarting) {
        console.log('Restart already in progress')
        return false
      }

      console.log('Restarting Anvil...')
      isRestarting = true

      try {
        if (!childProcess) {
          // No process reference - Anvil was started externally or crashed
          console.log('No process reference, starting fresh Anvil instance...')
          await manager.start()
        } else {
          // We have a process reference, do normal restart
          await manager.stop()
          await sleep(1000)
          await manager.start()
        }
        return true
      } catch (error) {
        throw new Error('Failed to restart Anvil', { cause: error })
      } finally {
        isRestarting = false
      }
    },

    async isHealthy(): Promise<boolean> {
      const result = await checkHealth()
      return result.healthy
    },

    async ensureHealthy(): Promise<boolean> {
      if (!(await manager.isHealthy())) {
        console.log('Anvil not healthy, attempting to fix...')
        return await manager.restart()
      }

      // Healthy anvil this process never spawned: a previous worker's survivor with
      // unknown chain state (arbitrary mutations, possibly un-pinned). Re-fork it to
      // the pinned launch state once before this worker's first test uses it.
      if (!childProcess && !adoptedExternalAnvil) {
        console.log('Adopting an already-running Anvil — resetting it to the pinned fork state...')
        await manager.resetFork()
        adoptedExternalAnvil = true
      }

      // The local node being healthy doesn't prove the upstream fork source still
      // accepts our credentials: uni RPC sessions can expire mid-run while anvil keeps
      // serving already-fetched state, and only NEW upstream fetches fail. Probe the
      // upstream with the active fork headers and relaunch with a refreshed session on
      // a definitive 401. This runs only here, at the test boundary — recovery is
      // deliberately never triggered mid-test (see the no-background-monitor note above).
      if (activeForkSource && Object.keys(activeForkSource.forkHeaders).length > 0) {
        const probe = await probeForkAuth(activeForkSource)
        if (shouldRelaunchForAuth(probe)) {
          console.warn('Upstream fork source rejected the session (401) — refreshing and relaunching Anvil...')
          await getConfig().forkSource.recover()
          return await manager.restart()
        }
      }

      return true
    },

    async resetFork(): Promise<void> {
      const cfg = getConfig()
      // Reuse the running fork source; resolve one first for an adopted anvil we
      // never launched (with uni RPC forking this bootstraps/reuses the session).
      const forkSource = activeForkSource ?? (await cfg.forkSource.getForkSource())
      activeForkSource = forkSource
      await manager.getClient().reset(
        buildResetForkParams({
          forkUrl: forkSource.forkUrl,
          forkBlockNumber: cfg.forkBlockNumber,
        }),
      )
      // anvil_reset rewinds node time to the pinned block's timestamp (and drops any
      // --load-state overlay); re-anchor the clock to wall time like at launch.
      await syncClockToWallClock(clockSyncRpcFromClient(manager.getClient()))
    },

    checkHealth,

    getClient(): AnvilClient {
      const cfg = getConfig()
      return createAnvilClient({
        url: `http://${cfg.host}:${cfg.port}`,
        timeout: cfg.timeout,
      })
    },

    getUrl(): string {
      const cfg = getConfig()
      return `http://${cfg.host}:${cfg.port}`
    },
  }

  return manager
}

// Singleton instance managed in module scope
let managerInstance: AnvilManager | null = null

/**
 * Get the singleton Anvil manager instance
 * Creates it lazily on first access
 */
export function getAnvilManager(): AnvilManager {
  if (!managerInstance) {
    managerInstance = createAnvilManager()
  }
  return managerInstance
}

/**
 * Reset the singleton instance (useful for testing)
 */
function _resetAnvilManager(): void {
  if (managerInstance) {
    managerInstance.stop().catch(console.error)
  }
  managerInstance = null
}
