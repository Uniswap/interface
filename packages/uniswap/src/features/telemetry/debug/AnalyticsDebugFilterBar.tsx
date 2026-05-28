import { useEffect, useMemo, useRef, useState } from 'react'
import { Flex, ScrollView, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons'
import type { AnalyticsDebugFilters, PropertyFilter } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'
import { useEvent } from 'utilities/src/react/hooks'

interface AnalyticsDebugFilterBarProps {
  filters: AnalyticsDebugFilters
  knownEventNames: Set<string>
  onSearchTextChange: (text: string) => void
  onToggleEventName: (name: string) => void
  onAddPropertyFilter: (filter: PropertyFilter) => void
  onRemovePropertyFilter: (index: number) => void
  onClearFilters: () => void
}

const inputBaseStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: 'none',
  borderRadius: 6,
  color: 'inherit',
  outline: 'none',
  fontFamily: 'inherit',
}

export function AnalyticsDebugFilterBar({
  filters,
  knownEventNames,
  onSearchTextChange,
  onToggleEventName,
  onAddPropertyFilter,
  onRemovePropertyFilter,
  onClearFilters,
}: AnalyticsDebugFilterBarProps): JSX.Element {
  const [localSearchText, setLocalSearchText] = useState(filters.searchText)
  const [showEventDropdown, setShowEventDropdown] = useState(false)
  const [propertyKey, setPropertyKey] = useState('')
  const [propertyValue, setPropertyValue] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearchChange = useEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setLocalSearchText(text)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      onSearchTextChange(text)
    }, 200)
  })

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const handlePropertyKeyDown = useEvent((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && propertyKey.trim()) {
      onAddPropertyFilter({ key: propertyKey.trim(), value: propertyValue.trim() })
      setPropertyKey('')
      setPropertyValue('')
    }
  })

  const sortedEventNames = useMemo(() => Array.from(knownEventNames).sort(), [knownEventNames])
  const hasActiveFilters =
    filters.searchText.length > 0 || filters.selectedEventNames.size > 0 || filters.propertyFilters.length > 0

  return (
    <Flex gap="$spacing4" px="$spacing8" py="$spacing4" borderBottomWidth={1} borderBottomColor="$surface3">
      {/* Search input — native HTML input for reliable typing in portal */}
      <input
        type="text"
        placeholder="Filter events by name..."
        value={localSearchText}
        style={{
          ...inputBaseStyle,
          fontSize: 12,
          height: 28,
          padding: '0 8px',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onChange={handleSearchChange}
      />

      {/* Event name filter + property filter row */}
      <Flex row gap="$spacing4" alignItems="center" flexWrap="wrap">
        <TouchableArea onPress={() => setShowEventDropdown((prev) => !prev)}>
          <Flex
            row
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded8"
            px="$spacing8"
            py="$spacing2"
          >
            <Text variant="body4" color="$neutral2">
              Events{filters.selectedEventNames.size > 0 ? ` (${filters.selectedEventNames.size})` : ''}
            </Text>
          </Flex>
        </TouchableArea>

        {/* Property filter inputs — native HTML inputs */}
        <Flex row gap="$spacing2" alignItems="center">
          <input
            type="text"
            placeholder="key"
            value={propertyKey}
            style={{ ...inputBaseStyle, fontSize: 11, height: 24, padding: '0 6px', width: 60 }}
            onChange={(e) => setPropertyKey(e.target.value)}
            onKeyDown={handlePropertyKeyDown}
          />
          <Text variant="body4" color="$neutral3">
            :
          </Text>
          <input
            type="text"
            placeholder="value"
            value={propertyValue}
            style={{ ...inputBaseStyle, fontSize: 11, height: 24, padding: '0 6px', width: 60 }}
            onChange={(e) => setPropertyValue(e.target.value)}
            onKeyDown={handlePropertyKeyDown}
          />
        </Flex>

        {hasActiveFilters && (
          <TouchableArea onPress={onClearFilters}>
            <Text variant="body4" color="$accent1">
              Clear
            </Text>
          </TouchableArea>
        )}
      </Flex>

      {/* Active property filter pills */}
      {filters.propertyFilters.length > 0 && (
        <Flex row gap="$spacing4" flexWrap="wrap">
          {filters.propertyFilters.map((filter, index) => (
            <Flex
              key={`${filter.key}-${index}`}
              row
              alignItems="center"
              backgroundColor="$accent2"
              borderRadius="$rounded8"
              px="$spacing4"
              py="$spacing2"
              gap="$spacing2"
            >
              <Text variant="body4" color="$accent1" fontSize={10}>
                {filter.key}:{filter.value}
              </Text>
              <TouchableArea onPress={() => onRemovePropertyFilter(index)}>
                <X size={10} color="$accent1" />
              </TouchableArea>
            </Flex>
          ))}
        </Flex>
      )}

      {/* Event name dropdown */}
      {showEventDropdown && (
        <Flex backgroundColor="$surface2" borderRadius="$rounded8" maxHeight={150} overflow="hidden">
          <ScrollView>
            {sortedEventNames.map((name) => (
              <TouchableArea key={name} onPress={() => onToggleEventName(name)}>
                <Flex
                  row
                  alignItems="center"
                  gap="$spacing4"
                  px="$spacing8"
                  py="$spacing4"
                  hoverStyle={{ backgroundColor: '$surface3' }}
                >
                  <Flex
                    centered
                    width={14}
                    height={14}
                    borderRadius="$rounded4"
                    borderWidth={1}
                    borderColor="$neutral3"
                    backgroundColor={filters.selectedEventNames.has(name) ? '$accent1' : 'transparent'}
                  />
                  <Text variant="body4" color="$neutral1" numberOfLines={1} flexShrink={1}>
                    {name}
                  </Text>
                </Flex>
              </TouchableArea>
            ))}
          </ScrollView>
        </Flex>
      )}
    </Flex>
  )
}
