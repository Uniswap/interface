import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text, useInput } from 'ink'
import { useCallback, useEffect, useState } from 'react'

interface WindowedSelectItem<T = unknown> {
  label: string
  value: string
  data?: T
}

interface WindowedSelectProps<T = unknown> {
  items: WindowedSelectItem<T>[]
  onSelect: (item: WindowedSelectItem<T>) => void
  onFocusChange?: (item: WindowedSelectItem<T> | null) => void
  limit?: number // Number of visible items (default: 10)
}

const DEFAULT_LIMIT = 10

export function WindowedSelect<T = unknown>({
  items,
  onSelect,
  onFocusChange,
  limit = DEFAULT_LIMIT,
}: WindowedSelectProps<T>): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [startIndex, setStartIndex] = useState(0)

  // Notify parent when focused item changes
  useEffect(() => {
    if (onFocusChange) {
      const focusedItem = items[selectedIndex] ?? null
      onFocusChange(focusedItem)
    }
  }, [selectedIndex, items, onFocusChange])

  // Calculate visible window
  const endIndex = Math.min(startIndex + limit, items.length)
  const visibleItems = items.slice(startIndex, endIndex)
  const relativeSelectedIndex = selectedIndex - startIndex

  // Keep selected item in view when it moves outside the window
  useEffect(() => {
    if (selectedIndex < startIndex) {
      // Selected item moved above visible window
      setStartIndex(Math.max(0, selectedIndex))
    } else if (selectedIndex >= endIndex) {
      // Selected item moved below visible window
      setStartIndex(Math.max(0, selectedIndex - limit + 1))
    }
  }, [selectedIndex, startIndex, endIndex, limit])

  // Reset to top when items change
  useEffect(() => {
    setSelectedIndex(0)
    setStartIndex(0)
  }, [])

  // Handle keyboard input
  useInput(
    useCallback(
      (input: string, key: { upArrow?: boolean; downArrow?: boolean; return?: boolean }) => {
        if (key.upArrow && selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1)
        } else if (key.downArrow && selectedIndex < items.length - 1) {
          setSelectedIndex(selectedIndex + 1)
        } else if (key.return) {
          const selectedItem = items[selectedIndex]
          if (selectedItem) {
            onSelect(selectedItem)
          }
        }
      },
      [selectedIndex, items, onSelect],
    ),
  )

  const hasMoreAbove = startIndex > 0
  const hasMoreBelow = endIndex < items.length

  return (
    <Box flexDirection="column">
      {hasMoreAbove && <Text dimColor>... {startIndex} more above (use ↑ to scroll) ...</Text>}
      {visibleItems.map((item, index) => {
        const isSelected = index === relativeSelectedIndex
        return (
          <Text key={item.value} color={isSelected ? colors.primary : undefined}>
            {isSelected ? '❯ ' : '  '}
            {item.label}
          </Text>
        )
      })}
      {hasMoreBelow && <Text dimColor>... {items.length - endIndex} more below (use ↓ to scroll) ...</Text>}
      <Box marginTop={1}>
        <Text dimColor>
          Selected: {selectedIndex + 1} of {items.length} (Enter to select)
        </Text>
      </Box>
    </Box>
  )
}
