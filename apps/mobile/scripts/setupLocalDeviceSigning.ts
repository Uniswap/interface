#!/usr/bin/env bun
/**
 * Switch a release build flavor to automatic signing for local device installs.
 *
 * The committed Xcode project uses manual signing with `match` App Store profiles
 * so CI/Fastlane can produce distribution builds. That signing can't install a
 * release-flavor build onto a personally-connected iPhone. This rewrites the chosen
 * flavor's build configuration to Xcode automatic signing with the Uniswap Labs team.
 *
 * Usage:
 *   bun mobile ios:signing:local <dev|beta|production>
 *   bun mobile ios:signing:local reset   # undo, restoring committed signing
 *
 * The changes are LOCAL ONLY — do not commit them.
 */
// oxlint-disable no-console -- CLI tool needs console for user output
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Uniswap Labs (Universal Navigation Inc.) Apple Developer team.
const TEAM_ID = 'JH3UHGZD75'

// Every target whose product is signed and embedded into the installed app.
const SIGNED_TARGETS = [
  'Uniswap',
  'OneSignalNotificationServiceExtension',
  'Widgets',
  'WidgetIntentExtension',
  'WidgetsCore',
]

const FLAVOR_TO_CONFIG: Record<string, string> = {
  dev: 'Dev',
  beta: 'Beta',
  production: 'Release',
  prod: 'Release',
}

const FLAVOR_TO_BUILD_CMD: Record<string, string> = {
  dev: 'ios:dev:release',
  beta: 'ios:beta',
  production: 'ios:release',
  prod: 'ios:release',
}

const OBJ_ID = '[0-9A-Fa-f]{24}'
const PBXPROJ = join(dirname(fileURLToPath(import.meta.url)), '..', 'ios', 'Uniswap.xcodeproj', 'project.pbxproj')

const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

function fail(message: string): never {
  console.error(`${RED}error:${RESET} ${message}`)
  process.exit(1)
}

/** Restore the committed (manual / `match`) signing by reverting the project file. */
function resetSigning(): void {
  execFileSync('git', ['checkout', '--', PBXPROJ], { stdio: 'inherit' })
  console.log(`  ✓ restored committed signing in ${PBXPROJ}`)
}

/** Resolve a target's build-configuration object id from the config lists. */
function configIdFor(text: string, target: string, configName: string): string | undefined {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const listRe = new RegExp(
    `/\\* Build configuration list for PBXNativeTarget "${escaped}" \\*/ = \\{[\\s\\S]*?buildConfigurations = \\(([\\s\\S]*?)\\);`,
  )
  const list = listRe.exec(text)
  if (!list) {
    return undefined
  }
  const entryRe = new RegExp(`(${OBJ_ID}) /\\* ([^*]+?) \\*/`, 'g')
  for (const [, id, name] of (list[1] ?? '').matchAll(entryRe)) {
    if (id && name?.trim() === configName) {
      return id
    }
  }
  return undefined
}

/** Replace a setting's value within a buildSettings body, or insert it if absent. */
function setSetting(body: string, key: string, value: string): string {
  const existing = new RegExp(`(\\n\\t\\t\\t\\t${key} = )[^\\n]*?;`)
  if (existing.test(body)) {
    return body.replace(existing, `$1${value};`)
  }
  return `\n\t\t\t\t${key} = ${value};${body}`
}

function updateBlock(text: string, configId: string, configName: string): string {
  const start = text.indexOf(`${configId} /* ${configName} */ = {`)
  const bs = text.indexOf('buildSettings = {', start) + 'buildSettings = {'.length
  const end = text.indexOf('\n\t\t\t};', bs)
  let body = text.slice(bs, end)

  // Drop any sdk-scoped identity override so the plain identity wins.
  body = body.replace(/\n\t\t\t\t"CODE_SIGN_IDENTITY\[sdk=[^\]]*\]" = [^\n]*?;/g, '')

  body = setSetting(body, 'CODE_SIGN_STYLE', 'Automatic')
  body = setSetting(body, 'CODE_SIGN_IDENTITY', '"Apple Development"')
  body = setSetting(body, 'DEVELOPMENT_TEAM', TEAM_ID)
  body = setSetting(body, 'PROVISIONING_PROFILE_SPECIFIER', '""')

  return text.slice(0, bs) + body + text.slice(end)
}

function main(): void {
  const flavor = process.argv[2]

  if (flavor === 'reset') {
    resetSigning()
    return
  }

  if (!flavor || !(flavor in FLAVOR_TO_CONFIG)) {
    fail('usage: bun mobile ios:signing:local <dev|beta|production|reset>')
  }

  const configName = FLAVOR_TO_CONFIG[flavor]
  if (!configName) {
    fail(`unknown flavor '${flavor}'`)
  }
  let text = readFileSync(PBXPROJ, 'utf8')

  for (const target of SIGNED_TARGETS) {
    const configId = configIdFor(text, target, configName)
    if (!configId) {
      fail(`could not find '${configName}' config for target '${target}'`)
    }
    text = updateBlock(text, configId, configName)
    console.log(`  ✓ ${target} → automatic signing, team ${TEAM_ID}`)
  }

  writeFileSync(PBXPROJ, text)

  const bar = '═'.repeat(64)
  console.log('')
  console.log(`${YELLOW}${bar}${RESET}`)
  console.log(
    `${YELLOW}⚠  DO NOT COMMIT these changes.${RESET} They switch the '${configName}' flavor to\n` +
      '   local automatic signing and will break CI/Fastlane distribution builds.',
  )
  console.log('   Revert when done:')
  console.log('     bun mobile ios:signing:local reset')
  console.log(`${YELLOW}${bar}${RESET}`)
  console.log('')
  console.log(`Next: connect your iPhone, then build/install the ${flavor} flavor`)
  console.log('(select your device when prompted), e.g.:')
  console.log(`     bun mobile ${FLAVOR_TO_BUILD_CMD[flavor]} --device`)
}

main()
