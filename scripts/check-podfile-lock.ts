#!/usr/bin/env bun
/**
 * Fast staleness check for apps/mobile/ios/Podfile.lock (<1s, no pod install).
 *
 * Catches the common failure mode where a JS dependency bump lands without
 * regenerating the lockfile, which otherwise only surfaces when the scheduled
 * iOS build fails post-merge.
 *
 * Three checks:
 * 1. Podfile checksum — the lock's `PODFILE CHECKSUM:` must equal the SHA1 of
 *    the raw bytes of apps/mobile/ios/Podfile (mirrors cocoapods-core).
 * 2. Version sync — every pod in `EXTERNAL SOURCES:` with a :path/:podspec is
 *    resolved to its nearest package.json; its `version` must equal the pod's
 *    resolved version in `PODS:`.
 * 3. Reverse — every direct dependency of apps/mobile/package.json that ships
 *    a *.podspec in its package root must be covered by `EXTERNAL SOURCES:`.
 *
 * Known limitation: podspec content changes at the same version are not
 * detected — those still require a real `pod install`.
 *
 * Exit 0 = lockfile in sync, exit 1 = stale (with instructions).
 *
 * Usage: bun scripts/check-podfile-lock.ts
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'

const REPO_ROOT = resolve(import.meta.dir, '..')
const IOS_DIR = join(REPO_ROOT, 'apps/mobile/ios')
const PODFILE = join(IOS_DIR, 'Podfile')
const LOCKFILE = join(IOS_DIR, 'Podfile.lock')
const MOBILE_PACKAGE_JSON = join(REPO_ROOT, 'apps/mobile/package.json')

const FIX = 'Fix: run `bun mobile pod` and commit the updated apps/mobile/ios/Podfile.lock'

/**
 * Pods whose resolved version structurally never matches the owning
 * package.json version:
 * - react-native's self-versioned third-party podspecs (react-native itself is
 *   still covered via the React/React-Core pods)
 * - Yoga (hardcoded 0.0.0 in react-native)
 * - ReactCodegen / ReactAppDependencyProvider (generated into gitignored
 *   build/generated/ios by pod install)
 */
const VERSION_CHECK_EXEMPT_PODS = new Set([
  'boost',
  'glog',
  'fmt',
  'fast_float',
  'RCT-Folly',
  'DoubleConversion',
  'hermes-engine',
  'Yoga',
  'ReactCodegen',
  'ReactAppDependencyProvider',
])

interface ParsedLock {
  podfileChecksum: string | undefined
  /** Top-level pod name -> resolved version, from the PODS: section */
  podVersions: Map<string, string>
  /** Pod name -> :path/:podspec value, from the EXTERNAL SOURCES: section */
  externalSources: Map<string, string>
}

function parseLock(lockText: string): ParsedLock {
  const podVersions = new Map<string, string>()
  const externalSources = new Map<string, string>()
  let podfileChecksum: string | undefined

  let section: 'PODS' | 'EXTERNAL SOURCES' | undefined
  let currentExternalPod: string | undefined

  for (const line of lockText.split('\n')) {
    if (/^\S/.test(line)) {
      section = line.startsWith('PODS:')
        ? 'PODS'
        : line.startsWith('EXTERNAL SOURCES:')
          ? 'EXTERNAL SOURCES'
          : undefined
      currentExternalPod = undefined
      const checksumMatch = line.match(/^PODFILE CHECKSUM: (\S+)/)
      if (checksumMatch?.[1]) {
        podfileChecksum = checksumMatch[1]
      }
      continue
    }

    if (section === 'PODS') {
      // Top-level entries only:   - Name (version)   or   - "Name (version)":
      const podMatch = line.match(/^ {2}- "?([^"(]+) \(([^)]+)\)"?:?$/)
      if (podMatch?.[1] && podMatch[2]) {
        podVersions.set(podMatch[1], podMatch[2])
      }
    } else if (section === 'EXTERNAL SOURCES') {
      const podNameMatch = line.match(/^ {2}(\S+):$/)
      if (podNameMatch?.[1]) {
        currentExternalPod = podNameMatch[1]
        continue
      }
      const pathMatch = line.match(/^ {4}:(?:path|podspec): "(.+)"$/)
      if (pathMatch?.[1] && currentExternalPod) {
        externalSources.set(currentExternalPod, pathMatch[1])
      }
    }
  }

  return { podfileChecksum, podVersions, externalSources }
}

/** Walk up from a path (file or directory) to the nearest package.json, without escaping the repo. */
function findNearestPackageJson(startPath: string): string | undefined {
  let dir = existsSync(startPath) && !startPath.endsWith('.podspec') ? startPath : dirname(startPath)
  while (dir.startsWith(REPO_ROOT)) {
    const candidate = join(dir, 'package.json')
    if (existsSync(candidate)) {
      return candidate
    }
    const parent = dirname(dir)
    if (parent === dir) {
      return undefined
    }
    dir = parent
  }
  return undefined
}

function readPackageVersion(packageJsonPath: string): string | undefined {
  const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed && typeof parsed.version === 'string') {
    return parsed.version
  }
  return undefined
}

function readPackageDependencyNames(packageJsonPath: string): string[] {
  const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null) {
    return []
  }
  const names: string[] = []
  if ('dependencies' in parsed && typeof parsed.dependencies === 'object' && parsed.dependencies !== null) {
    names.push(...Object.keys(parsed.dependencies))
  }
  if ('devDependencies' in parsed && typeof parsed.devDependencies === 'object' && parsed.devDependencies !== null) {
    names.push(...Object.keys(parsed.devDependencies))
  }
  return names
}

function safeRealpath(path: string): string | undefined {
  try {
    return realpathSync(path)
  } catch {
    return undefined
  }
}

function main(): number {
  const errors: string[] = []

  const lock = parseLock(readFileSync(LOCKFILE, 'utf8'))

  // Check 1: Podfile checksum (SHA1 of the raw Podfile bytes, as cocoapods-core computes it)
  // nosemgrep: javascript.node-stdlib.cryptography.crypto-weak-algorithm.crypto-weak-algorithm -- CocoaPods' PODFILE CHECKSUM is sha1 of the Podfile; not a security use
  const podfileSha1 = createHash('sha1').update(readFileSync(PODFILE)).digest('hex')
  if (!lock.podfileChecksum) {
    errors.push('Podfile.lock has no PODFILE CHECKSUM line — the lockfile looks malformed or truncated.')
  } else if (lock.podfileChecksum !== podfileSha1) {
    errors.push(
      `Podfile changed without regenerating Podfile.lock:\n` +
        `      PODFILE CHECKSUM in lock: ${lock.podfileChecksum}\n` +
        `      sha1 of apps/mobile/ios/Podfile: ${podfileSha1}`,
    )
  }

  // Check 2: every locally-sourced pod's resolved version matches its package.json
  let checkedVersions = 0
  const externalSourceRealpaths: string[] = []
  for (const [pod, sourcePath] of lock.externalSources) {
    const absoluteSource = resolve(IOS_DIR, sourcePath)
    const realSource = safeRealpath(existsSync(absoluteSource) ? absoluteSource : dirname(absoluteSource))
    if (realSource) {
      externalSourceRealpaths.push(realSource)
    }

    if (VERSION_CHECK_EXEMPT_PODS.has(pod)) {
      continue
    }
    const packageJsonPath = findNearestPackageJson(realSource ?? absoluteSource)
    if (!packageJsonPath) {
      errors.push(`Pod "${pod}" points at "${sourcePath}" but no package.json was found there — run a fresh install.`)
      continue
    }
    const packageVersion = readPackageVersion(packageJsonPath)
    const lockedVersion = lock.podVersions.get(pod)
    if (!lockedVersion) {
      errors.push(`Pod "${pod}" is in EXTERNAL SOURCES but has no resolved version in the PODS section.`)
      continue
    }
    if (!packageVersion) {
      // No "version" field to compare against — skip rather than count it as a checked pod.
      continue
    }
    checkedVersions += 1
    if (packageVersion !== lockedVersion) {
      errors.push(
        `Pod "${pod}" is locked at ${lockedVersion} but ${packageJsonPath.slice(REPO_ROOT.length + 1)} is at ${packageVersion}.`,
      )
    }
  }
  if (checkedVersions === 0) {
    errors.push('No locally-sourced pods were version-checked — the EXTERNAL SOURCES section looks malformed.')
  }

  // Check 3 (reverse): direct mobile deps that ship a podspec must be in EXTERNAL SOURCES
  for (const dependency of readPackageDependencyNames(MOBILE_PACKAGE_JSON)) {
    const packageRoot = safeRealpath(join(REPO_ROOT, 'node_modules', dependency))
    if (!packageRoot) {
      continue
    }
    const shipsPodspec = readdirSync(packageRoot).some((entry) => entry.endsWith('.podspec'))
    if (!shipsPodspec) {
      continue
    }
    const covered = externalSourceRealpaths.some(
      (sourcePath) => sourcePath === packageRoot || sourcePath.startsWith(packageRoot + sep),
    )
    if (!covered) {
      errors.push(`"${dependency}" ships a podspec but has no EXTERNAL SOURCES entry in Podfile.lock.`)
    }
  }

  if (errors.length > 0) {
    console.error('❌ apps/mobile/ios/Podfile.lock is out of sync:\n')
    for (const error of errors) {
      console.error(`  • ${error}\n`)
    }
    console.error(FIX)
    return 1
  }

  console.log(`✅ Podfile.lock is in sync (checksum ok, ${checkedVersions} locally-sourced pod versions match).`)
  return 0
}

process.exit(main())
