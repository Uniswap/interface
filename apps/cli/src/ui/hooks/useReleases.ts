import { type Release, ReleaseScanner } from '@universe/cli/src/lib/release-scanner'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseReleasesResult {
  releases: Release[]
  loading: boolean
  error: Error | null
  getLatest: (platform: 'mobile' | 'extension') => Promise<Release | null>
  getPrevious: (release: Release) => Promise<Release | null>
  findRelease: (platform: 'mobile' | 'extension', version: string) => Promise<Release | null>
  refresh: (platform?: 'mobile' | 'extension') => Promise<void>
}

export function useReleases(platform?: 'mobile' | 'extension'): UseReleasesResult {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [scanner] = useState(() => new ReleaseScanner())
  const isScanningRef = useRef(false)
  const lastScannedPlatformRef = useRef<string | undefined>(undefined)

  const refresh = useCallback(
    async (filterPlatform?: 'mobile' | 'extension') => {
      // Guard: Prevent multiple simultaneous scans
      if (isScanningRef.current) {
        return
      }

      const targetPlatform = filterPlatform || platform
      const platformKey = targetPlatform || 'all'

      // Guard: Don't re-scan if we already scanned for this platform
      if (lastScannedPlatformRef.current === platformKey) {
        return
      }

      try {
        isScanningRef.current = true
        setLoading(true)
        setError(null)
        const fetched = await scanner.scanReleases(targetPlatform)
        setReleases(fetched)
        lastScannedPlatformRef.current = platformKey
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      } finally {
        isScanningRef.current = false
      }
    },
    [scanner, platform],
  )

  useEffect(() => {
    // Only scan on initial mount or when platform actually changes
    const platformKey = platform || 'all'
    if (lastScannedPlatformRef.current !== platformKey) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
      refresh()
    }
  }, [platform, refresh])

  const getLatest = useCallback(
    async (targetPlatform: 'mobile' | 'extension'): Promise<Release | null> => {
      try {
        return await scanner.getLatestRelease(targetPlatform)
      } catch (_err) {
        return null
      }
    },
    [scanner],
  )

  const getPrevious = useCallback(
    async (release: Release): Promise<Release | null> => {
      try {
        return await scanner.getPreviousRelease(release)
      } catch (_err) {
        return null
      }
    },
    [scanner],
  )

  const findRelease = useCallback(
    async (targetPlatform: 'mobile' | 'extension', version: string): Promise<Release | null> => {
      try {
        return await scanner.findRelease(targetPlatform, version)
      } catch (_err) {
        return null
      }
    },
    [scanner],
  )

  return {
    releases,
    loading,
    error,
    getLatest,
    getPrevious,
    findRelease,
    refresh,
  }
}
