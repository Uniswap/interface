import type { Release } from '@universe/cli/src/lib/release-scanner'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { formatBranch } from '@universe/cli/src/ui/utils/format'
import { Text } from 'ink'

interface ReleaseListProps {
  releases: Release[]
  selectedIndex: number | null
  platform?: 'mobile' | 'extension'
}

export function ReleaseList({ releases, selectedIndex, platform }: ReleaseListProps): JSX.Element {
  const filtered = platform ? releases.filter((r) => r.platform === platform) : releases

  if (filtered.length === 0) {
    return <Text color="yellow">No releases found</Text>
  }

  return (
    <>
      {filtered.map((release, index) => {
        const isSelected = selectedIndex === index
        const prefix = isSelected ? '→ ' : '  '

        return (
          <Text key={`${release.platform}-${release.version}`} color={isSelected ? colors.primary : undefined}>
            {prefix}
            {release.platform}/{release.version} ({formatBranch(release.branch)})
          </Text>
        )
      })}
    </>
  )
}
