#!/usr/bin/env bun
/**
 * Resolve AWS Device Farm ARNs and connect `agent-device` to a hosted device.
 *
 * Wraps the tedious part of the Device Farm flow — finding the project, a
 * remote-access-enabled device, and a previously uploaded app build — then
 * runs `agent-device connect aws-device-farm` with the resolved ARNs.
 * Connect is local-only and free; billing only starts at `agent-device open`.
 *
 * Usage:
 *   bun mobile devicefarm:connect                             # Pixel + newest Android upload
 *   bun mobile devicefarm:connect --device "Pixel 8" --app pr35338
 *   bun mobile devicefarm:connect --app-arn arn:aws:devicefarm:...:upload/...
 *   bun mobile devicefarm:connect --dry-run                   # resolve + print, don't connect
 *
 * Credentials come from the default AWS credential chain (SSO profile, env
 * vars, or an injecting proxy) — nothing is hardcoded. Requires the `aws` CLI
 * on PATH (agent-device itself shells out to it too).
 *
 * See apps/mobile/docs/agent-device.md for the full workflow.
 */
// oxlint-disable no-console -- CLI tool needs console for user output
import { execFileSync } from 'node:child_process'
import { parseArgs } from 'node:util'

// Provisional default — expected to change; override via --project or AWS_DEVICE_FARM_PROJECT_ARN
const DEFAULT_PROJECT_NAME = 'uniswap-pr34890'
const DEFAULT_REGION = 'us-west-2'
const DEFAULT_DEVICE_FILTER = 'Pixel'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function fail(message: string): never {
  console.error(`${RED}error:${RESET} ${message}`)
  process.exit(1)
}

const { values: args } = parseArgs({
  options: {
    project: { type: 'string', default: DEFAULT_PROJECT_NAME },
    device: { type: 'string', default: DEFAULT_DEVICE_FILTER },
    app: { type: 'string', default: '' },
    'app-arn': { type: 'string' },
    platform: { type: 'string', default: 'android' },
    region: {
      type: 'string',
      default: process.env['AWS_REGION'] ?? process.env['AWS_DEFAULT_REGION'] ?? DEFAULT_REGION,
    },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

if (args.help) {
  console.log(`Resolve Device Farm ARNs and run \`agent-device connect aws-device-farm\`.

Options:
  --project <name>   Device Farm project name (default: ${DEFAULT_PROJECT_NAME});
                     or set AWS_DEVICE_FARM_PROJECT_ARN to skip the lookup
  --device <filter>  substring match on device name/model (default: ${DEFAULT_DEVICE_FILTER})
  --app <filter>     substring match on upload name; newest SUCCEEDED match wins
  --app-arn <arn>    exact upload ARN (skips the uploads lookup)
  --platform <p>     android | ios (default: android)
  --region <region>  AWS region (default: AWS_REGION or ${DEFAULT_REGION})
  --dry-run          resolve and print the connect command without running it`)
  process.exit(0)
}

const platform = args.platform.toLowerCase()
if (platform !== 'android' && platform !== 'ios') {
  fail(`--platform must be android or ios, got '${args.platform}'`)
}

function aws(cliArgs: string[]): unknown {
  const fullArgs = ['devicefarm', ...cliArgs, '--region', args.region, '--output', 'json']
  try {
    const stdout = execFileSync('aws', fullArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    return JSON.parse(stdout)
  } catch (error) {
    const stderr =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string' ? error.stderr.trim() : ''
    fail(
      `aws ${fullArgs.slice(0, 2).join(' ')} failed.\n${stderr || String(error)}\n\n` +
        `Check your AWS credentials (default chain): humans, log into your SSO profile ` +
        `(e.g. \`aws sso login\` + AWS_PROFILE); agents/CI, ensure the env provides credentials.`,
    )
  }
}

interface DeviceFarmProject {
  arn: string
  name: string
}

interface DeviceFarmDevice {
  arn: string
  name: string
  model?: string
  os?: string
  platform?: string
  availability?: string
  remoteAccessEnabled?: boolean
  fleetType?: string
}

interface DeviceFarmUpload {
  arn: string
  name: string
  status?: string
  // Epoch seconds from the aws CLI (ISO string from some SDK versions).
  created?: number | string
  type?: string
}

function createdMs(upload: DeviceFarmUpload): number {
  if (typeof upload.created === 'number') {
    return upload.created * 1000
  }
  const parsed = Date.parse(upload.created ?? '')
  return Number.isNaN(parsed) ? 0 : parsed
}

function resolveProjectArn(): string {
  const override = process.env['AWS_DEVICE_FARM_PROJECT_ARN']
  if (override) {
    console.log(`${GREEN}project${RESET}  ${override} (from AWS_DEVICE_FARM_PROJECT_ARN)`)
    return override
  }
  const { projects } = aws(['list-projects']) as { projects: DeviceFarmProject[] }
  const project = projects.find((p) => p.name === args.project)
  if (!project) {
    fail(
      `no Device Farm project named '${args.project}'. Available: ${projects.map((p) => p.name).join(', ') || '(none)'}`,
    )
  }
  console.log(`${GREEN}project${RESET}  ${project.name} → ${project.arn}`)
  return project.arn
}

function resolveDeviceArn(): string {
  const { devices } = aws(['list-devices']) as { devices: DeviceFarmDevice[] }
  const filter = args.device.toLowerCase()
  const candidates = devices.filter(
    (d) =>
      d.remoteAccessEnabled === true &&
      d.platform?.toLowerCase() === platform &&
      `${d.name} ${d.model ?? ''}`.toLowerCase().includes(filter),
  )
  if (candidates.length === 0) {
    fail(`no remote-access-enabled ${platform} device matching '${args.device}'`)
  }
  // Prefer devices Device Farm reports as most available right now; break ties with newest OS.
  const availabilityRank = (d: DeviceFarmDevice): number =>
    ['HIGHLY_AVAILABLE', 'AVAILABLE', 'BUSY'].indexOf(d.availability ?? '') + 1 || 99
  const osVersion = (d: DeviceFarmDevice): number => Number.parseFloat(d.os ?? '0') || 0
  candidates.sort((a, b) => availabilityRank(a) - availabilityRank(b) || osVersion(b) - osVersion(a))
  const device = candidates[0]
  if (!device) {
    fail(`no remote-access-enabled ${platform} device matching '${args.device}'`)
  }
  console.log(`${GREEN}device${RESET}   ${device.name} / ${device.os} (${device.availability}) → ${device.arn}`)
  const alternates = candidates.slice(1, 4)
  if (alternates.length > 0) {
    console.log(`         other matches: ${alternates.map((d) => `${d.name}/${d.os} (${d.availability})`).join(', ')}`)
  }
  return device.arn
}

function resolveAppArn(projectArn: string): string {
  const explicit = args['app-arn']
  if (explicit) {
    console.log(`${GREEN}app${RESET}      ${explicit} (from --app-arn)`)
    return explicit
  }
  const uploadType = platform === 'android' ? 'ANDROID_APP' : 'IOS_APP'
  const { uploads } = aws(['list-uploads', '--arn', projectArn, '--type', uploadType]) as {
    uploads: DeviceFarmUpload[]
  }
  const filter = args.app.toLowerCase()
  const candidates = uploads
    .filter((u) => u.status === 'SUCCEEDED' && u.name.toLowerCase().includes(filter))
    .sort((a, b) => createdMs(b) - createdMs(a))
  const upload = candidates[0]
  if (!upload) {
    fail(
      `no SUCCEEDED ${uploadType} upload${filter ? ` matching '${args.app}'` : ''} in the project. ` +
        `Upload one first (see apps/mobile/docs/agent-device.md) or pass --app-arn.`,
    )
  }
  console.log(
    `${GREEN}app${RESET}      ${upload.name} (uploaded ${new Date(createdMs(upload)).toISOString()}) → ${upload.arn}`,
  )
  return upload.arn
}

const projectArn = resolveProjectArn()
const deviceArn = resolveDeviceArn()
const appArn = resolveAppArn(projectArn)

const connectArgs = [
  'agent-device',
  'connect',
  'aws-device-farm',
  '--platform',
  platform,
  '--aws-project-arn',
  projectArn,
  '--aws-device-arn',
  deviceArn,
  '--aws-app-arn',
  appArn,
  '--aws-region',
  args.region,
]

console.log(`\n${GREEN}connect${RESET}  bunx ${connectArgs.join(' ')}`)
if (args['dry-run']) {
  console.log(`${YELLOW}dry-run:${RESET} not connecting.`)
  process.exit(0)
}

// `bunx` resolves the repo-pinned agent-device from node_modules/.bin.
execFileSync('bunx', connectArgs, { stdio: 'inherit' })

console.log(`
${GREEN}Connected.${RESET} Next steps (session is created — and ${YELLOW}billing starts${RESET} — at \`open\`):
  bunx agent-device open com.uniswap.mobile.dev   # ~70s: allocates device + installs app
  bunx agent-device snapshot -i                   # semantic UI tree with @eN refs
  bunx agent-device click @eN --settle
  bunx agent-device close                         # stop PROMPTLY — device minutes are metered
  bunx agent-device artifacts --json              # video/logs, ready ~2.5 min after close
  bunx agent-device disconnect`)
