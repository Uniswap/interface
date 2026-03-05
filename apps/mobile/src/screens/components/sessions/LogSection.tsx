import React, { memo } from 'react'
import { type LogEntry, useSessionsDebugStore } from 'src/screens/stores/sessionsDebugStore'
import { Flex, Text, TouchableArea } from 'ui/src'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const LogEntryRow = memo(function LogEntryRow({ log, index }: { log: LogEntry; index: number }): JSX.Element {
  return (
    <Text
      key={`${log.timestamp.getTime()}-${index}`}
      variant="body3"
      color={log.type === 'error' ? '$statusCritical' : log.type === 'success' ? '$statusSuccess' : '$neutral2'}
    >
      {formatTime(log.timestamp)} - {log.message}
    </Text>
  )
})

export const LogSection = memo(function LogSection(): JSX.Element | null {
  const logs = useSessionsDebugStore((state) => state.logs)
  const clearLogs = useSessionsDebugStore((state) => state.clearLogs)

  if (logs.length === 0) {
    return null
  }

  return (
    <Flex backgroundColor="$surface2" p="$spacing16" borderRadius="$rounded16" gap="$spacing8">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="subheading1">Operation Log</Text>
        <TouchableArea onPress={clearLogs}>
          <Text variant="body3" color="$neutral3">
            Clear
          </Text>
        </TouchableArea>
      </Flex>

      {logs.map((log, index) => (
        <LogEntryRow key={`${log.timestamp.getTime()}-${index}`} log={log} index={index} />
      ))}
    </Flex>
  )
})
