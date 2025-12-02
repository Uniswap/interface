import type { Release } from '@universe/cli/src/lib/release-scanner'
import { Select } from '@universe/cli/src/ui/components/Select'
import { StatusBadge } from '@universe/cli/src/ui/components/StatusBadge'
import { WindowedSelect } from '@universe/cli/src/ui/components/WindowedSelect'
import { useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { useReleases } from '@universe/cli/src/ui/hooks/useReleases'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { formatBranch } from '@universe/cli/src/ui/utils/format'
import { Box, Text } from 'ink'
import { useEffect, useMemo, useState } from 'react'

interface ReleaseSelectorProps {
  onSelect: (release: Release, comparison: Release | null) => void
  onBack: () => void
}

export function ReleaseSelector({ onSelect, onBack }: ReleaseSelectorProps): JSX.Element {
  const { releases, loading, error, getLatest, getPrevious } = useReleases()
  const { dispatch } = useAppState()
  const [platformFilter, setPlatformFilter] = useState<'mobile' | 'extension' | 'all'>('all')
  const [mode, setMode] = useState<'quick' | 'browse' | 'filter-platform'>('quick')

  useEffect(() => {
    if (releases.length > 0) {
      dispatch({ type: 'SET_RELEASES', releases })
    }
  }, [releases, dispatch])

  // Filter releases (releases come sorted newest first, so newest will be at top)
  const filteredReleases = useMemo(
    () => (platformFilter === 'all' ? releases : releases.filter((r: Release) => r.platform === platformFilter)),
    [releases, platformFilter],
  )

  const quickOptions = [
    { label: 'Latest Mobile Release', value: 'latest-mobile' },
    { label: 'Latest Extension Release', value: 'latest-extension' },
    { label: 'Browse Releases', value: 'browse' },
    { label: 'Back', value: 'back' },
  ]

  const handleQuickSelect = async (option: { label: string; value: string }): Promise<void> => {
    if (option.value === 'back') {
      onBack()
      return
    }

    if (option.value === 'browse') {
      setMode('browse')
      return
    }

    try {
      const platform = option.value === 'latest-mobile' ? 'mobile' : 'extension'
      const latest = await getLatest(platform)
      if (latest) {
        const previous = await getPrevious(latest)
        dispatch({ type: 'SELECT_RELEASE', release: latest })
        dispatch({ type: 'SET_COMPARISON_RELEASE', release: previous })
        onSelect(latest, previous)
      }
    } catch (_err) {
      // Error handled by hook
    }
  }

  const handleBrowseSelect = (index: number): void => {
    const release = filteredReleases[index]
    if (release) {
      getPrevious(release)
        .then((previous: Release | null) => {
          dispatch({ type: 'SELECT_RELEASE', release })
          dispatch({ type: 'SET_COMPARISON_RELEASE', release: previous })
          onSelect(release, previous)
        })
        .catch(() => {
          // Error handled silently - user can still select the release
          dispatch({ type: 'SELECT_RELEASE', release })
          dispatch({ type: 'SET_COMPARISON_RELEASE', release: null })
          onSelect(release, null)
        })
    }
  }

  // Platform filter mode - select platform first
  if (mode === 'filter-platform') {
    const platformOptions = [
      { label: '← Back', value: 'back' },
      { label: 'All Platforms', value: 'all' },
      { label: 'Mobile Only', value: 'mobile' },
      { label: 'Extension Only', value: 'extension' },
    ]

    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={2}>
          <Text bold color={colors.primary}>
            Select Platform Filter
          </Text>
        </Box>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Filter releases by platform:</Text>
          </Box>
          <Select
            items={platformOptions}
            onSelect={(item: { label: string; value: string }) => {
              if (item.value === 'back') {
                setMode('browse')
              } else {
                setPlatformFilter(item.value as 'mobile' | 'extension' | 'all')
                setMode('browse')
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  // Browse mode - show releases
  if (mode === 'browse') {
    // Create options with navigation and filter controls at the top
    const browseOptions = [
      { label: '← Back to Quick Actions', value: 'back' },
      { label: '🔍 Filter by Platform', value: 'filter' },
      ...filteredReleases.map((release: Release, index: number) => ({
        label: `${release.platform}/${release.version} (${formatBranch(release.branch)})`,
        value: String(index + 2), // Offset by 2 for back and filter options
        release,
      })),
    ]

    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={2}>
          <Text bold color={colors.primary}>
            Select Release
          </Text>
        </Box>
        <Box flexDirection="column">
          {loading && (
            <Box marginBottom={1}>
              <StatusBadge type="info">Loading releases...</StatusBadge>
            </Box>
          )}
          {error && (
            <Box marginBottom={1}>
              <StatusBadge type="error">Error: {error.message}</StatusBadge>
            </Box>
          )}

          {!loading && !error && (
            <>
              <Text dimColor>
                Showing {filteredReleases.length} release{filteredReleases.length !== 1 ? 's' : ''}{' '}
                {platformFilter !== 'all' ? `(${platformFilter})` : ''}
              </Text>
              <WindowedSelect
                items={browseOptions}
                limit={12}
                onSelect={(item: { label: string; value: string; release?: Release }) => {
                  if (item.value === 'back') {
                    setMode('quick')
                  } else if (item.value === 'filter') {
                    setMode('filter-platform')
                  } else if (item.release) {
                    const release = item.release
                    const index = filteredReleases.findIndex(
                      (r: Release) => r.platform === release.platform && r.version === release.version,
                    )
                    if (index >= 0) {
                      handleBrowseSelect(index)
                    }
                  }
                }}
              />
            </>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Release Selection
        </Text>
      </Box>
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text>Choose a quick action or browse releases:</Text>
        </Box>
        <Select items={quickOptions} onSelect={handleQuickSelect} />
      </Box>
    </Box>
  )
}
