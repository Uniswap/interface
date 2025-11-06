/* eslint-disable no-console */
import { ChildProcess, spawn } from 'child_process'
import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { createClient, createTestClient, http, publicActions, walletActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const TEST_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

interface AnvilConfig {
  port: number
  host: string
  forkUrl: string
  timeout: number
  healthCheckInterval: number
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
  getClient(): AnvilClient
  getUrl(): string
}

/**
 * Build fork URL from environment variables
 */
function buildForkUrl(): string {
  const endpoint = process.env.REACT_APP_QUICKNODE_ENDPOINT_NAME
  const token = process.env.REACT_APP_QUICKNODE_ENDPOINT_TOKEN
  if (!endpoint || !token) {
    throw new Error('Missing QuickNode credentials for Anvil fork')
  }
  return `https://${endpoint}.quiknode.pro/${token}`
}

/**
 * Build Anvil configuration with defaults and overrides
 */
function buildAnvilConfig(overrides?: Partial<AnvilConfig>): AnvilConfig {
  return {
    port: overrides?.port ?? parseInt(process.env.ANVIL_PORT ?? '8545'),
    host: overrides?.host ?? '127.0.0.1',
    forkUrl: overrides?.forkUrl ?? buildForkUrl(),
    timeout: overrides?.timeout ?? 10_000,
    healthCheckInterval: overrides?.healthCheckInterval ?? 10_000,
    logFile: overrides?.logFile ?? path.join(process.cwd(), `anvil-test-${process.pid}.log`),
  }
}

/**
 * Kill any existing process on the specified port
 */
async function killExistingProcess(port: number): Promise<void> {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`)
  } catch {
    // Ignore errors - port might be free
  }
}

/**
 * Create an Anvil client for interacting with the local node
 */
function createAnvilClient(ctx: { url: string; timeout?: number }) {
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
  let healthCheckTimer: NodeJS.Timeout | null = null

  // Lazy config getter
  const getConfig = (): AnvilConfig => {
    if (!config) {
      config = buildAnvilConfig(configOverrides)
    }
    return config
  }

  // Stop health monitoring
  const stopHealthMonitoring = (): void => {
    if (healthCheckTimer) {
      clearInterval(healthCheckTimer)
      healthCheckTimer = null
    }
  }

  // Start health monitoring
  const startHealthMonitoring = (manager: AnvilManager): void => {
    if (healthCheckTimer) {
      return
    }

    const cfg = getConfig()
    healthCheckTimer = setInterval(async () => {
      const healthy = await manager.isHealthy()
      if (!healthy && !isRestarting) {
        console.error('Anvil health check failed, attempting restart...')
        await manager.restart()
      }
    }, cfg.healthCheckInterval)
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
      const blockNumber = await client.getBlockNumber()
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

      // Kill any existing process on the port
      await killExistingProcess(cfg.port)

      // Prepare log file
      const logStream = fs.createWriteStream(cfg.logFile, { flags: 'a' })

      // Start Anvil process
      childProcess = spawn(
        'anvil',
        [
          '--fork-url',
          cfg.forkUrl,
          '--port',
          String(cfg.port),
          '--host',
          cfg.host,
          '--hardfork',
          'prague',
          '--no-rate-limit',
          '--print-traces',
        ],
        {
          env: { ...process.env, RUST_LOG: 'debug' },
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

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        console.log(`Anvil process exited with code ${code} and signal ${signal}`)
        childProcess = null
        stopHealthMonitoring()
      })

      // Wait for Anvil to be ready
      const ready = await waitForHealth({
        maxAttempts: 30,
        initialDelay: 1000,
      })

      if (!ready) {
        throw new Error('Anvil failed to start')
      }

      console.log('Anvil is ready and accepting connections')
      startHealthMonitoring(manager)
    },

    async stop(): Promise<void> {
      stopHealthMonitoring()

      if (!childProcess) {
        return
      }

      console.log('Stopping Anvil...')
      childProcess.kill('SIGTERM')

      // Give it time to shut down gracefully
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Force kill if still running
      childProcess.kill('SIGKILL')

      childProcess = null
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
          await new Promise((resolve) => setTimeout(resolve, 1000))
          await manager.start()
        }

        isRestarting = false
        return true
      } catch (error) {
        console.error('Failed to restart Anvil:', error)
        isRestarting = false
        return false
      }
    },

    async isHealthy(): Promise<boolean> {
      const result = await checkHealth()
      return result.healthy
    },

    async ensureHealthy(): Promise<boolean> {
      if (await manager.isHealthy()) {
        return true
      }

      console.log('Anvil not healthy, attempting to fix...')
      return await manager.restart()
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

export type AnvilClient = ReturnType<typeof createAnvilClient>
