import { spawn } from 'node:child_process'

const ABSOLUTE_OUTDIR_BY_PLATFORM = {
  darwin: '/Users/Shared/stretch',
  win32: 'C:/ProgramData/stretch',
  linux: '/var/tmp/stretch',
} as const

function getAbsoluteOutdir(): string {
  const platform = process.platform
  if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
    return ABSOLUTE_OUTDIR_BY_PLATFORM[platform]
  }
  throw new Error(`Unsupported platform "${platform}" for absolute extension output path`)
}

function getChromeUserDataDir(absoluteOutdir: string): string {
  return `${absoluteOutdir}/chrome-data`
}

const absoluteOutdir = getAbsoluteOutdir()

const child = spawn('wxt', {
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    WXT_ABSOLUTE_OUTDIR: absoluteOutdir,
    WXT_CHROME_USER_DATA_DIR: process.env['WXT_CHROME_USER_DATA_DIR'] ?? getChromeUserDataDir(absoluteOutdir),
  },
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
