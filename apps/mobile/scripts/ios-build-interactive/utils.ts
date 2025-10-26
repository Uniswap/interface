// biome-ignore-all lint/suspicious/noConsole: CLI tool needs console for user interaction

import { exec, spawn } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Constants
export const CONSTANTS = {
  PORTS: {
    METRO: 8081,
  },
  PATHS: {
    MOBILE_DIR: 'apps/mobile',
    ENV_FILE: '.env.defaults.local',
    BUILD_DIR: 'ios/build',
  },
  COMMANDS: {
    XCODE_VERSION: 'xcodebuild -version',
    NODE_VERSION: 'node --version',
    BUN_VERSION: 'bun --version',
    POD_VERSION: 'pod --version',
    LIST_SIMULATORS: 'xcrun simctl list devices',
    LIST_SIMULATORS_JSON: 'xcrun simctl list devices --json',
    LIST_DEVICES_NEW: 'xcrun devicectl list devices',
    LIST_DEVICES_OLD: 'xcrun instruments -s devices',
    CHECK_PORT: 'lsof -i :',
    START_METRO: ['bun', 'run', 'start'],
    CLEAN_BUILD: 'rm -rf',
    POD_INSTALL: 'bun run pod',
  },
  TIMEOUTS: {
    METRO_START: 3000,
    METRO_RESET: 2000,
  },
  MESSAGES: {
    EMOJIS: {
      CHECK: '🔍',
      SUCCESS: '✅',
      ERROR: '❌',
      WARNING: '⚠️',
      ROCKET: '🚀',
      CLEAN: '🧹',
      TRASH: '🗑️',
      BUILD: '🔨',
      BULB: '💡',
      PHONE: '📱',
      DEVICE: '📲',
      PARTY: '🎉',
      WAVE: '👋',
    },
    ERRORS: {
      WRONG_DIR: 'Please run this script from the apps/mobile directory',
      ENV_MISSING: 'Environment file missing!',
      ENV_DOWNLOAD:
        'bun run env:local:download (from apps/mobile) OR bun run mobile env:local:download (from workspace root)',
      BUILD_FAILED: 'Build failed with exit code',
      PREFLIGHT_FAILED: 'Pre-flight check failed:',
    },
  },
} as const

// Types
export type BuildType = 'simulator' | 'device'
export type Configuration = 'Debug' | 'Release'
export type Scheme = 'Uniswap'

export interface BuildConfig {
  buildType: BuildType
  configuration: Configuration
  scheme: Scheme
  simulator?: string
  device?: string
  cleanBuild: boolean
  resetMetroCache: boolean
}

export interface SimulatorDevice {
  name: string
  udid: string
  state: string
  isAvailable: boolean
}

export interface PhysicalDevice {
  name: string
  udid: string
  platform: string
}

export interface PreflightCheck {
  name: string
  command: string
}

// Utility functions
export const log = {
  info: (message: string): void => console.log(message),
  success: (message: string): void => console.log(`${CONSTANTS.MESSAGES.EMOJIS.SUCCESS} ${message}`),
  error: (message: string): void => console.log(`${CONSTANTS.MESSAGES.EMOJIS.ERROR} ${message}`),
  warning: (message: string): void => console.log(`${CONSTANTS.MESSAGES.EMOJIS.WARNING} ${message}`),
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const runCommand = async (command: string): Promise<{ stdout: string; stderr: string }> => {
  return execAsync(command)
}

export const spawnProcess = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    // biome-ignore lint/suspicious/noExplicitAny: Node spawn options type requires any for stdio config
    const process = spawn(command, args, { stdio: 'inherit' } as any)
    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Process failed with exit code ${code}`))
      }
    })
  })
}

export const parseDeviceFromLine = (line: string): PhysicalDevice | null => {
  const match = line.match(/^(.+?)\s+\(([0-9.]+)\)\s+\[([A-F0-9-]+)\]/)
  if (!match || line.includes('Simulator')) {
    return null
  }

  const [, name, version, udid] = match
  if (name && version && udid) {
    return {
      name: name.trim(),
      udid,
      platform: `iOS ${version}`,
    }
  }
  return null
}

export const printBuildInfo = (config: BuildConfig, targetType: string): void => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.BUILD} Building for ${targetType}...`)
  log.info(`Configuration: ${config.configuration}`)
  log.info(`Scheme: ${config.scheme}`)
  const targetName = config.buildType === 'simulator' ? config.simulator : config.device
  if (targetName) {
    log.info(`Target ${targetType}: ${targetName}`)
  }
}

export const printTroubleshootingTips = (isDevice: boolean): void => {
  log.info(`\n${CONSTANTS.MESSAGES.EMOJIS.BULB} Troubleshooting suggestions:`)
  log.info('1. Try cleaning build folder and resetting Metro cache')
  log.info(`2. Ensure all pods are installed: ${CONSTANTS.COMMANDS.POD_INSTALL}`)
  log.info('3. Check Xcode for any signing or configuration issues')

  if (isDevice) {
    log.info('4. Ensure your device is connected and trusted')
    log.info('5. Check your signing certificates in Xcode')
    log.info('6. Verify your provisioning profiles are valid')
    log.info('7. Make sure your device is registered in your Apple Developer account')
  } else {
    log.info('4. Verify the selected simulator is available')
  }
}

export const printHelp = (): void => {
  log.info(`${CONSTANTS.MESSAGES.EMOJIS.PHONE} iOS Build Interactive Tool`)
  log.info('')
  log.info('Interactive CLI tool for building iOS apps with various configurations.')
  log.info('')
  log.info('Features:')
  log.info('• Choose between simulator and device builds')
  log.info('• Select Debug or Release configurations')
  log.info('• Pick from multiple app schemes')
  log.info('• Auto-detect available simulators and devices')
  log.info('• Metro bundler management')
  log.info('• Build cleaning and cache reset options')
  log.info('')
  log.info('Usage: bun run ios:interactive')
}

// Prompt configurations
export const PROMPT_CONFIGS = {
  buildType: {
    type: 'list' as const,
    name: 'buildType' as const,
    message: 'What type of build do you want?',
    choices: [
      { name: `${CONSTANTS.MESSAGES.EMOJIS.PHONE} iOS Simulator`, value: 'simulator' },
      { name: `${CONSTANTS.MESSAGES.EMOJIS.DEVICE} Physical Device`, value: 'device' },
    ],
  },
  configuration: {
    type: 'list' as const,
    name: 'configuration' as const,
    message: 'Select build configuration:',
    choices: [
      { name: 'Debug (faster build, debugging enabled)', value: 'Debug' },
      { name: 'Release (optimized, production-ready)', value: 'Release' },
    ],
    default: 'Debug',
  },
  utilities: {
    type: 'checkbox' as const,
    name: 'utilities' as const,
    message: 'Select additional options:',
    choices: [
      { name: 'Clean build folder before building', value: 'clean' },
      { name: 'Reset Metro cache', value: 'resetCache' },
    ],
  },
}
