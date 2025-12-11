import { Portal } from 'components/Popups/Portal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { RefObject, useCallback, useRef } from 'react'
import { Checkbox, Flex, styled, Text, useMedia } from 'ui/src'
import { SortVertical } from 'ui/src/components/icons/SortVertical'

const FilterDropdown = styled(Flex, {
  position: 'absolute',
  p: '$padding8',
  borderRadius: '$rounded12',
  backgroundColor: '$surface2',
  gap: '$gap8',
  width: 240,
  borderWidth: 1,
  borderColor: '$surface3',
  borderStyle: 'solid',
  shadowColor: '$shadow',
  opacity: 1,
  zIndex: '$modal',
  $md: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    top: 'unset',
    width: '100vw',
  },
})

const FilterRow = styled(Flex, {
  row: true,
  py: 10,
  px: '$padding8',
  justifyContent: 'space-between',
  borderRadius: '$rounded8',
  hoverStyle: {
    backgroundColor: '$surface3',
  },
})

interface FilterProps<T extends string> {
  allFilters: {
    value: T
    label: string
  }[]
  activeFilter: T[]
  setFilters: (filter: T[]) => void
  isOpen: boolean
  toggleFilterModal: () => void
  anchorRef: RefObject<HTMLElement | null>
}

export function Filter<T extends string>({
  allFilters,
  activeFilter,
  setFilters,
  isOpen,
  toggleFilterModal,
  anchorRef,
}: FilterProps<T>) {
  const media = useMedia()
  const isMobile = media.md
  const filterModalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside({ node: filterModalRef, handler: isOpen ? toggleFilterModal : undefined })

  const handleFilterOptionClick = useCallback(
    (filter: T) => {
      if (activeFilter.includes(filter)) {
        setFilters(activeFilter.filter((f) => f !== filter))
      } else {
        setFilters([...activeFilter, filter])
      }
    },
    [activeFilter, setFilters],
  )

  return (
    <>
      <SortVertical color="$neutral3" size="$icon.16" />
      {isOpen && anchorRef.current && (
        <Portal>
          <FilterDropdown
            ref={filterModalRef}
            top={isMobile ? 'unset' : anchorRef.current.getBoundingClientRect().y + 42 + window.scrollY}
            left={anchorRef.current.getBoundingClientRect().x}
          >
            {allFilters.map((filter) => (
              <FilterRow key={filter.value} onPress={() => handleFilterOptionClick(filter.value)} cursor="pointer">
                <Text $short={{ variant: 'buttonLabel4' }} variant="subheading2">
                  {filter.label}
                </Text>
                <Checkbox checked={activeFilter.includes(filter.value)} variant="branded" />
              </FilterRow>
            ))}
          </FilterDropdown>
        </Portal>
      )}
    </>
  )
}
