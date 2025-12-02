#!/usr/bin/env ts-node
// biome-ignore lint/suspicious/noConsole: CLI tool needs console for user interaction
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import inquirer from 'inquirer'
import { homedir } from 'os'
import { join } from 'path'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {
  type BuildConfig,
  type BuildType,
  CONSTANTS,
  type Configuration,
  log,
  type PhysicalDevice,
  PROMPT_CONFIGS,
  type PreflightCheck,
  parseDeviceFromLine,
  printBuildInfo,
  printHelp,
  printTroubleshootingTips,
  runCommand,
  type Scheme,
  type SimulatorDevice,
  sleep,
  spawnProcess,
} from './utils'

// Pre-flight checks
const checkPreflightRequirements = async (): Promise<void> => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.CHECK} Running pre-flight checks...\n`)

  const checks: PreflightCheck[] = [
    { name: 'Xcode', command: CONSTANTS.COMMANDS.XCODE_VERSION },
    { name: 'Node.js', command: CONSTANTS.COMMANDS.NODE_VERSION },
    { name: 'Bun', command: CONSTANTS.COMMANDS.BUN_VERSION },
    { name: 'CocoaPods', command: CONSTANTS.COMMANDS.POD_VERSION },
    { name: 'iOS Simulator', command: CONSTANTS.COMMANDS.LIST_SIMULATORS },
  ]

  for (const check of checks) {
    try {
      await runCommand(check.command)
      log.success(`${check.name} is available`)
    } catch (error) {
      log.error(`${check.name} is not available or not working properly`)
      throw new Error(`${CONSTANTS.MESSAGES.ERRORS.PREFLIGHT_FAILED} ${check.name}`)
    }
  }

  log.success('\nAll pre-flight checks passed!\n')
}

const checkCurrentDirectory = (): void => {
  const currentDir = process.cwd()

  if (!currentDir.endsWith(CONSTANTS.PATHS.MOBILE_DIR)) {
    log.error(CONSTANTS.MESSAGES.ERRORS.WRONG_DIR)
    log.info(`Current directory: ${currentDir}`)
    process.exit(1)
  }
}

const checkEnvironmentFile = (): void => {
  const envFilePath = join(process.cwd(), '..', '..', CONSTANTS.PATHS.ENV_FILE)

  if (!existsSync(envFilePath)) {
    log.error(CONSTANTS.MESSAGES.ERRORS.ENV_MISSING)
    log.info('')
    log.info(`The required ${CONSTANTS.PATHS.ENV_FILE} file was not found in the project root.`)
    log.info('This file contains necessary environment variables for the build.')
    log.info('')
    log.info('Please run the following command to download it:')
    log.info(`  ${CONSTANTS.MESSAGES.ERRORS.ENV_DOWNLOAD}`)
    log.info('')
    process.exit(1)
  }
}

const getAvailableSimulators = async (): Promise<SimulatorDevice[]> => {
  try {
    const { stdout } = await runCommand(CONSTANTS.COMMANDS.LIST_SIMULATORS_JSON)
    const data = JSON.parse(stdout)

    const simulators: SimulatorDevice[] = []

    Object.keys(data.devices).forEach((runtime) => {
      if (runtime.includes('iOS')) {
        data.devices[runtime].forEach((device: { name: string; udid: string; state: string; isAvailable: boolean }) => {
          simulators.push({
            name: `${device.name} (${runtime.replace('com.apple.CoreSimulator.SimRuntime.', '').replace('-', ' ')})`,
            udid: device.udid,
            state: device.state,
            isAvailable: device.isAvailable,
          })
        })
      }
    })

    return simulators.filter((sim) => sim.isAvailable)
  } catch (error) {
    log.warning('Could not fetch simulator list, using default options')
    return []
  }
}

const getConnectedDevices = async (): Promise<PhysicalDevice[]> => {
  try {
    // Try new devicectl command first (iOS 17+)
    try {
      const { stdout } = await runCommand(CONSTANTS.COMMANDS.LIST_DEVICES_NEW)
      const lines = stdout.split('\n').filter((line) => line.includes('iPhone') || line.includes('iPad'))
      return lines
        .map((line) => {
          const parts = line.trim().split(/\s+/)
          const name = parts.slice(0, -1).join(' ')
          const udid = parts[parts.length - 1]
          return {
            name: name || 'Unknown Device',
            udid: udid || 'unknown',
            platform: 'iOS',
          }
        })
        .filter((device) => device.name !== 'Unknown Device')
    } catch {
      // Fallback to older instruments command
      const { stdout } = await runCommand(CONSTANTS.COMMANDS.LIST_DEVICES_OLD)
      const lines = stdout.split('\n')
      const devices: PhysicalDevice[] = []

      for (const line of lines) {
        const device = parseDeviceFromLine(line)
        if (device) {
          devices.push(device)
        }
      }
      return devices
    }
  } catch (error) {
    log.warning('Could not fetch connected devices, will use generic device build')
    return []
  }
}

const checkMetroStatus = async (): Promise<boolean> => {
  try {
    const { stdout } = await runCommand(`${CONSTANTS.COMMANDS.CHECK_PORT}${CONSTANTS.PORTS.METRO}`)
    return stdout.includes('node')
  } catch {
    return false
  }
}

const startMetro = async (): Promise<void> => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.ROCKET} Starting Metro bundler...`)

  const metro = spawn(CONSTANTS.COMMANDS.START_METRO[0], CONSTANTS.COMMANDS.START_METRO.slice(1), {
    stdio: 'pipe',
    detached: true,
  })

  metro.unref()

  await sleep(CONSTANTS.TIMEOUTS.METRO_START)

  const isRunning = await checkMetroStatus()
  if (isRunning) {
    log.success('Metro bundler started successfully\n')
  } else {
    log.warning('Metro bundler may not have started properly\n')
  }
}

const cleanBuildFolder = async (): Promise<void> => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.CLEAN} Cleaning build folder...`)
  try {
    // Clean local build directory
    await runCommand(`${CONSTANTS.COMMANDS.CLEAN_BUILD} ${CONSTANTS.PATHS.BUILD_DIR}`)

    // Clean Xcode DerivedData using proper home directory path
    const derivedDataPath = join(homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData')
    await runCommand(`${CONSTANTS.COMMANDS.CLEAN_BUILD} ${derivedDataPath}`)

    log.success('Build folder cleaned\n')
  } catch (error) {
    log.warning('Could not clean build folder completely\n')
  }
}

const resetMetroCache = async (): Promise<void> => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.TRASH} Resetting Metro cache...`)
  try {
    // Use spawn with detached option to properly run the reset command
    const resetProcess = spawn('bun', ['run', 'start', '--reset-cache'], {
      stdio: 'ignore',
      detached: true,
    })

    resetProcess.unref()

    // Give it time to start the reset process
    await sleep(CONSTANTS.TIMEOUTS.METRO_RESET)

    // Kill the process after it has initiated the cache reset
    if (resetProcess.pid) {
      try {
        process.kill(-resetProcess.pid)
      } catch {
        // Process may have already exited, which is fine
      }
    }

    log.success('Metro cache reset\n')
  } catch (error) {
    log.warning('Could not reset Metro cache\n')
  }
}

const buildForSimulator = async (config: BuildConfig): Promise<void> => {
  printBuildInfo(config, 'iOS Simulator')

  const args = ['rnef', 'run:ios', '--scheme', 'Uniswap', '--configuration', config.configuration]

  if (config.simulator) {
    const simulatorName = config.simulator.split('(')[0]?.trim()
    args.push(`--device="${simulatorName}"`)
  }

  log.info(`Command: bun run ${args.join(' ')}\n`)

  try {
    await spawnProcess('bun', ['run', ...args])
    log.success('\nBuild completed successfully!')
  } catch (error) {
    printTroubleshootingTips(false)
    throw error
  }
}

const buildForDevice = async (config: BuildConfig): Promise<void> => {
  printBuildInfo(config, 'iOS Device')

  const args = [
    'rnef',
    'run:ios',
    '--scheme',
    config.scheme,
    '--configuration',
    config.configuration,
    '--destination',
    'device',
  ]

  if (config.configuration === 'Release') {
    args.push('--archive')
  }

  log.info(`Command: bun run ${args.join(' ')}\n`)

  try {
    await spawnProcess('bun', ['run', ...args])
    log.success('\nBuild completed successfully!')
  } catch (error) {
    printTroubleshootingTips(true)
    throw error
  }
}

const main = async (): Promise<void> => {
  // Handle help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    return
  }

  log.info(`${CONSTANTS.MESSAGES.EMOJIS.PHONE} iOS Build Interactive Tool\n`)

  try {
    // Pre-flight checks
    checkCurrentDirectory()
    checkEnvironmentFile()
    await checkPreflightRequirements()

    // Check Metro status
    const isMetroRunning = await checkMetroStatus()
    if (!isMetroRunning) {
      const { startMetroChoice } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'startMetroChoice',
          message: 'Metro bundler is not running. Start it now?',
          default: true,
        },
      ])

      if (startMetroChoice) {
        await startMetro()
      }
    } else {
      log.success('Metro bundler is already running\n')
    }

    // Get available simulators and devices
    const [simulators, devices] = await Promise.all([getAvailableSimulators(), getConnectedDevices()])

    // Build configuration prompts
    const answers = await inquirer.prompt<{
      buildType: BuildType
      configuration: Configuration
      scheme: Scheme
      simulator?: string
      device?: string
    }>([PROMPT_CONFIGS.buildType, PROMPT_CONFIGS.configuration])

    // Simulator selection
    if (answers.buildType === 'simulator' && simulators.length > 0) {
      const { simulator } = await inquirer.prompt([
        {
          type: 'list',
          name: 'simulator',
          message: 'Select target simulator:',
          choices: [
            { name: 'Default simulator', value: null },
            ...simulators.map((sim) => ({ name: sim.name, value: sim.name })),
          ],
        },
      ])
      answers.simulator = simulator
    }

    // Device selection
    if (answers.buildType === 'device' && devices.length > 0) {
      const { device } = await inquirer.prompt([
        {
          type: 'list',
          name: 'device',
          message: 'Select target device:',
          choices: [
            { name: 'Any connected device', value: null },
            ...devices.map((dev) => ({ name: `${dev.name} (${dev.platform})`, value: dev.name })),
          ],
        },
      ])
      answers.device = device
    }

    // Utility options
    const { utilities } = await inquirer.prompt<{ utilities: string[] }>([PROMPT_CONFIGS.utilities])

    const config: BuildConfig = {
      ...answers,
      scheme: 'Uniswap',
      cleanBuild: utilities.includes('clean'),
      resetMetroCache: utilities.includes('resetCache'),
    }

    // Execute pre-build utilities
    if (config.cleanBuild) {
      await cleanBuildFolder()
    }

    if (config.resetMetroCache) {
      await resetMetroCache()
    }

    // Execute build
    log.info(`${CONSTANTS.MESSAGES.EMOJIS.ROCKET} Starting build process...\n`)

    if (config.buildType === 'simulator') {
      await buildForSimulator(config)
    } else {
      await buildForDevice(config)
    }

    log.info(`\n${CONSTANTS.MESSAGES.EMOJIS.PARTY} Build process completed successfully!`)
  } catch (error) {
    console.error(
      `\n${CONSTANTS.MESSAGES.EMOJIS.ERROR} Build process failed:`,
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log.info(`\n\n${CONSTANTS.MESSAGES.EMOJIS.WAVE} Build process interrupted by user`)
  process.exit(0)
})

process.on('SIGTERM', () => {
  log.info(`\n\n${CONSTANTS.MESSAGES.EMOJIS.WAVE} Build process terminated`)
  process.exit(0)
})

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
