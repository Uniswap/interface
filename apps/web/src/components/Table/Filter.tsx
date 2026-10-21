import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { CheckboxCompat } from '@universe/mycelium/checkbox-compat'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { spacing } from '@universe/mycelium/tokens'
import { forwardRef, RefObject, useCallback, useRef } from 'react'
import { Portal } from '~/components/Popups/Portal'
import { useOnClickOutside } from '~/hooks/useOnClickOutside'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'

// The mobile panel is fixed to the viewport bottom, so its padding (not its offset) grows by the
// in-app-browser chrome / safe-area inset: the last row clears the band and the surface still meets the edge.
const MOBILE_PADDING_BOTTOM = `calc(${spacing.spacing8}px + ${MWEB_BOTTOM_INSET})` as const

const FilterDropdown = forwardRef<HTMLDivElement, FlexCompatProps>(function FilterDropdown(props, ref) {
  return (
    <Flex
      ref={ref}
      position="absolute"
      p="$padding8"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      gap="$gap8"
      width={240}
      borderWidth={1}
      borderColor="$surface3"
      borderStyle="solid"
      shadowColor="$shadowColor"
      opacity={1}
      zIndex="$modal"
      $md={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        top: 'unset',
        width: '100vw',
        pb: MOBILE_PADDING_BOTTOM,
      }}
      {...props}
    />
  )
})

const FilterRow = forwardRef<HTMLDivElement, FlexCompatProps>(function FilterRow(props, ref) {
  return (
    <Flex
      ref={ref}
      row
      py={10}
      px="$padding8"
      justifyContent="space-between"
      borderRadius="$rounded8"
      hoverStyle={{ backgroundColor: '$surface3' }}
      {...props}
    />
  )
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
  minSelected?: number
  anchorRef: RefObject<HTMLElement | null>
}

export function Filter<T extends string>({
  allFilters,
  activeFilter,
  setFilters,
  isOpen,
  toggleFilterModal,
  minSelected,
  anchorRef,
}: FilterProps<T>) {
  const media = useMedia()
  const isMobile = media.md
  const filterModalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside({ node: filterModalRef, handler: isOpen ? toggleFilterModal : undefined })

  const handleFilterOptionClick = useCallback(
    (filter: T) => {
      const isSelected = activeFilter.includes(filter)
      const isBelowMinSelected = minSelected && activeFilter.length <= minSelected

      // If the filter is already selected and unselecting it would result in fewer than the minimum selected filters, do nothing
      if (isBelowMinSelected && isSelected) {
        return
      }

      if (isSelected) {
        setFilters(activeFilter.filter((f) => f !== filter))
      } else {
        setFilters([...activeFilter, filter])
      }
    },
    [activeFilter, minSelected, setFilters],
  )

  return (
    <>
      <ChevronsOut color="$neutral3" size="$icon.16" />
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
                <CheckboxCompat checked={activeFilter.includes(filter.value)} variant="branded" />
              </FilterRow>
            ))}
          </FilterDropdown>
        </Portal>
      )}
    </>
  )
}
