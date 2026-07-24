// oxlint-disable eslint-js/no-restricted-syntax -- Node-side Playwright code: process.env is the config surface here (no app getConfig())
/**
 * Cross-process anvil process bookkeeping (Node-side Playwright code).
 *
 * The anvil manager singleton lives inside each Playwright WORKER process, but global
 * teardown runs in the RUNNER process where those singletons (and their child-process
 * handles) don't exist — so worker-spawned anvils used to survive every run. Each
 * spawn records its PID in a per-port file here, and teardown kills by PID file plus
 * an lsof port mop-up.
 */
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { sleep } from 'utilities/src/time/timing'

/** PID-file path for the anvil child on a port, readable across processes (worker vs global teardown). */
function anvilPidFilePath(port: number): string {
  return path.join(os.tmpdir(), `anvil-e2e-${port}.pid`)
}

function writeAnvilPidFile(ctx: { port: number; pid: number }): void {
  try {
    fs.writeFileSync(anvilPidFilePath(ctx.port), String(ctx.pid))
  } catch (error) {
    console.warn(`Failed to write anvil PID file for port ${ctx.port}:`, error)
  }
}

function removeAnvilPidFile(port: number): void {
  try {
    fs.rmSync(anvilPidFilePath(port), { force: true })
  } catch {
    // Best effort — a stale PID file is handled by the liveness check on read.
  }
}

/** Reads the recorded anvil PID for a port; undefined when absent or malformed. */
function readAnvilPidFile(port: number): number | undefined {
  try {
    const raw = fs.readFileSync(anvilPidFilePath(port), 'utf8').trim()
    return /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : undefined
  } catch {
    return undefined
  }
}

/**
 * True when the PID is alive AND its command looks like anvil — guards against recycled PIDs.
 * Sync on purpose: it runs only at launch/teardown boundaries (never mid-test), and a
 * blocking check can't interleave with the kill decision that follows it.
 */
function isLiveAnvilPid(pid: number): boolean {
  try {
    process.kill(pid, 0)
  } catch {
    return false
  }
  try {
    const stdout = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' })
    return stdout.toLowerCase().includes('anvil')
  } catch {
    return false
  }
}

/**
 * Kill any existing process on the specified port. Sync on purpose — see
 * {@link isLiveAnvilPid}; nothing can grab the port between the lsof and the spawn.
 */
function killExistingProcess(port: number): void {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' })
  } catch {
    // Ignore errors - port might be free
  }
}

/**
 * Kills any anvil left on the port, from ANY process: the recorded PID (graceful
 * SIGTERM, then SIGKILL) plus an lsof mop-up for strays without a PID file.
 * This is the global-teardown path — see the module doc above.
 */
async function terminateAnvilOnPort(port: number): Promise<void> {
  const pid = readAnvilPidFile(port)
  if (pid !== undefined && isLiveAnvilPid(pid)) {
    try {
      process.kill(pid, 'SIGTERM')
      // Grace period, then hard kill if it ignored SIGTERM.
      for (let i = 0; i < 20 && isLiveAnvilPid(pid); i++) {
        await sleep(100)
      }
      if (isLiveAnvilPid(pid)) {
        process.kill(pid, 'SIGKILL')
      }
    } catch {
      // Process exited between the liveness check and the kill — fine.
    }
  }
  removeAnvilPidFile(port)
  killExistingProcess(port)
}

/** The port the (lazily configured) anvil manager binds to — shared with global teardown. */
function resolveConfiguredAnvilPort(): number {
  return parseInt(process.env.ANVIL_PORT ?? '8545')
}

export { killExistingProcess, removeAnvilPidFile, resolveConfiguredAnvilPort, terminateAnvilOnPort, writeAnvilPidFile }
