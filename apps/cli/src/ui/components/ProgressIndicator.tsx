import type { ProgressEvent, ProgressStage } from '@universe/cli/src/ui/services/orchestrator-service'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'

interface Stage {
  key: ProgressStage
  label: string
}

const stages: Stage[] = [
  { key: 'collecting', label: 'Collecting data' },
  { key: 'analyzing', label: 'Analyzing with AI' },
  { key: 'delivering', label: 'Delivering results' },
]

interface ProgressIndicatorProps {
  currentStage: ProgressStage
  message?: string
  cacheInfo?: ProgressEvent['cacheInfo']
}

export function ProgressIndicator({ currentStage, message, cacheInfo }: ProgressIndicatorProps): JSX.Element {
  const currentIndex = stages.findIndex((s) => s.key === currentStage)

  const getCacheLabel = (cacheInfoItem: ProgressEvent['cacheInfo']): string => {
    if (!cacheInfoItem) {
      return ''
    }
    const typeLabel = cacheInfoItem.type === 'commits' ? 'commits' : cacheInfoItem.type === 'prs' ? 'PRs' : 'stats'
    return `(cached: ${cacheInfoItem.count} ${typeLabel})`
  }

  return (
    <Box flexDirection="column" gap={0}>
      {stages.map((stage, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex && currentStage !== 'idle' && currentStage !== 'error'

        let icon = '○'
        let color = 'gray'

        if (isComplete) {
          icon = '●'
          color = 'green'
        } else if (isCurrent) {
          icon = '◉'
          color = colors.primary
        }

        // Show cache info for collecting stage when it's current or complete
        const showCacheInfo = cacheInfo && stage.key === 'collecting' && (isCurrent || isComplete)

        return (
          <Text key={stage.key} color={color}>
            {icon} {stage.label}
            {showCacheInfo && (
              <Text dimColor color="gray">
                {' '}
                {getCacheLabel(cacheInfo)}
              </Text>
            )}
            {isCurrent && !showCacheInfo && '...'}
          </Text>
        )
      })}
      {message && (
        <Box marginTop={1}>
          <Text dimColor color="gray">
            {message}
          </Text>
        </Box>
      )}
    </Box>
  )
}
