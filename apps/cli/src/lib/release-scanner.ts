/* eslint-disable no-console */

import type { Logger } from '@universe/cli/src/lib/logger'
import { $ } from 'bun'

// ============================================================================
// Types
// ============================================================================

export interface Release {
  platform: 'mobile' | 'extension'
  version: string
  branch: string
  major: number
  minor: number
  patch: number
  prerelease?: string
}

export interface ReleaseComparison {
  from: Release
  to: Release
  commitRange: string
}

// ============================================================================
// Release Scanner
// ============================================================================

export class ReleaseScanner {
  constructor(
    private repoPath: string = process.cwd(),
    private logger?: Logger,
  ) {}

  /**
   * Scan all release branches for a given platform
   */
  async scanReleases(platform?: 'mobile' | 'extension'): Promise<Release[]> {
    this.logger?.info(`Scanning for ${platform || 'all'} release branches...`)

    // Get all remote branches
    const result = await $`git -C ${this.repoPath} branch -r`.text()
    const branches = result
      .split('\n')
      .map((b: string) => b.trim())
      .filter(Boolean)

    // Filter for release branches
    const releasePattern = platform ? `origin/releases/${platform}/` : 'origin/releases/'

    const releaseBranches = branches
      .filter((b: string) => b.includes(releasePattern))
      .filter((b: string) => !b.includes('->')) // Exclude symbolic refs
      .filter((b: string) => !b.includes('/dev')) // Exclude dev branches
      .filter((b: string) => !b.match(/cherry|kickstart|mirror|temp|mp\//)) // Exclude special branches

    // Parse into Release objects
    const releases: Release[] = []

    for (const branch of releaseBranches) {
      const release = this.parseReleaseBranch(branch)
      if (release) {
        releases.push(release)
      }
    }

    // Sort by version (newest first)
    return releases.sort((a, b) => this.compareVersions(b, a))
  }

  /**
   * Get the latest release for a platform
   */
  async getLatestRelease(platform: 'mobile' | 'extension'): Promise<Release | null> {
    const releases = await this.scanReleases(platform)
    return releases[0] || null
  }

  /**
   * Get the previous release before a given version
   */
  async getPreviousRelease(release: Release): Promise<Release | null> {
    const releases = await this.scanReleases(release.platform)

    // Find the current release index
    const currentIndex = releases.findIndex((r) => r.version === release.version && r.platform === release.platform)

    if (currentIndex === -1 || currentIndex === releases.length - 1) {
      return null
    }

    // Return the next one (which is older since we sorted newest first)
    const nextRelease = releases[currentIndex + 1]
    return nextRelease ?? null
  }

  /**
   * Find a specific release by platform and version
   */
  async findRelease(platform: 'mobile' | 'extension', version: string): Promise<Release | null> {
    const releases = await this.scanReleases(platform)
    return releases.find((r) => r.version === version) || null
  }

  async getReleaseComparison(args: {
    platform: 'mobile' | 'extension'
    version: string
    compareWith?: string
  }): Promise<ReleaseComparison | null> {
    const { platform, version, compareWith } = args
    const toRelease = await this.findRelease(platform, version)
    if (!toRelease) {
      throw new Error(`Release ${platform}/${version} not found`)
    }

    let fromRelease: Release | null = null

    if (compareWith) {
      fromRelease = await this.findRelease(platform, compareWith)
      if (!fromRelease) {
        throw new Error(`Release ${platform}/${compareWith} not found`)
      }
    } else {
      // Auto-detect previous release
      fromRelease = await this.getPreviousRelease(toRelease)
      if (!fromRelease) {
        this.logger?.warn(`No previous release found for ${platform}/${version}`)
        return null
      }
    }

    // Use origin/ prefix for git commands
    return {
      from: fromRelease,
      to: toRelease,
      commitRange: `origin/${fromRelease.branch}..origin/${toRelease.branch}`,
    }
  }

  /**
   * List releases in a formatted way
   */
  async listReleases(platform?: 'mobile' | 'extension'): Promise<void> {
    const releases = await this.scanReleases(platform)

    if (releases.length === 0) {
      console.log('No releases found')
      return
    }

    // Group by platform if showing all
    const grouped = releases.reduce(
      (acc, release) => {
        if (!acc[release.platform]) {
          acc[release.platform] = []
        }
        const platformReleases = acc[release.platform]
        if (platformReleases) {
          platformReleases.push(release)
        }
        return acc
      },
      {} as Record<string, Release[]>,
    )

    for (const [plat, rels] of Object.entries(grouped)) {
      console.log(`\n${plat.toUpperCase()} RELEASES:`)

      console.log('─'.repeat(40))

      for (const rel of rels.slice(0, 10)) {
        // Show only latest 10

        console.log(`  ${rel.version.padEnd(10)} → ${rel.branch}`)
      }

      if (rels.length > 10) {
        console.log(`  ... and ${rels.length - 10} more`)
      }
    }
  }

  /**
   * Get commits between two releases
   */
  async getReleaseCommits(comparison: ReleaseComparison): Promise<string> {
    const result = await $`git -C ${this.repoPath} log ${comparison.commitRange} --oneline`.text()
    return result
  }

  /**
   * Parse a release branch name into a Release object
   */
  private parseReleaseBranch(branch: string): Release | null {
    // Match patterns like:
    // origin/releases/mobile/1.60
    // origin/releases/extension/1.30.0
    // Safe regex pattern - matches controlled git branch names only
    // eslint-disable-next-line security/detect-unsafe-regex -- Controlled pattern matching git branch names with bounded quantifiers
    const match = branch.match(/^origin\/releases\/(mobile|extension)\/(\d+)\.(\d+)(?:\.(\d+))?(?:\.(.+))?$/)

    if (!match) {
      return null
    }

    const [, platform, major, minor, patch, prerelease] = match
    if (!platform || !major || !minor) {
      return null
    }
    const version = patch
      ? `${major}.${minor}.${patch}${prerelease ? `.${prerelease}` : ''}`
      : `${major}.${minor}${prerelease ? `.${prerelease}` : ''}`

    return {
      platform: platform as 'mobile' | 'extension',
      version,
      branch: branch.replace('origin/', ''),
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch ?? '0', 10),
      prerelease: prerelease ?? undefined,
    }
  }

  /**
   * Compare two versions (returns positive if a > b, negative if a < b, 0 if equal)
   */
  private compareVersions(a: Release, b: Release): number {
    // Compare major
    if (a.major !== b.major) {
      return a.major - b.major
    }

    // Compare minor
    if (a.minor !== b.minor) {
      return a.minor - b.minor
    }

    // Compare patch
    if (a.patch !== b.patch) {
      return a.patch - b.patch
    }

    // Compare prerelease (if both have it)
    if (a.prerelease && b.prerelease) {
      return a.prerelease.localeCompare(b.prerelease)
    }

    // Version without prerelease is greater than with prerelease
    if (a.prerelease && !b.prerelease) {
      return -1
    }
    if (!a.prerelease && b.prerelease) {
      return 1
    }

    return 0
  }
}

/**
 * Parse a release identifier like "mobile/1.60" or "extension/1.30.0"
 */
export function parseReleaseIdentifier(
  identifier: string,
): { platform: 'mobile' | 'extension'; version: string } | null {
  const match = identifier.match(/^(mobile|extension)\/(.+)$/)
  if (!match) {
    return null
  }

  const platform = match[1] as 'mobile' | 'extension'
  const version = match[2]
  if (!version) {
    return null
  }

  return {
    platform,
    version,
  }
}
