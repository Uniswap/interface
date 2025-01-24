import { DropdownIcon } from 'components/Table/icons'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import deprecatedStyled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { RefObject, useCallback, useRef } from 'react'
import { Checkbox, Flex, Text, styled } from 'ui/src'

const StyledDropdownIcon = deprecatedStyled(DropdownIcon)`
  position: relative;
`
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
  allFilters: T[]
  activeFilter: T[]
  setFilters: (filter: T[]) => void
  isOpen: boolean
  toggleFilterModal: () => void
  anchorRef: RefObject<HTMLElement>
}

export function Filter<T extends string>({
  allFilters,
  activeFilter,
  setFilters,
  isOpen,
  toggleFilterModal,
  anchorRef,
}: FilterProps<T>) {
  const isScreenSize = useScreenSize()
  const isMobile = !isScreenSize['sm']
  const filterModalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(filterModalRef, isOpen ? toggleFilterModal : undefined)

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
      <StyledDropdownIcon />
      {isOpen && anchorRef.current && (
        <Portal>
          <FilterDropdown
            ref={filterModalRef}
            top={isMobile ? 'unset' : anchorRef.current.getBoundingClientRect().y + 42 + window.scrollY}
            left={anchorRef.current.getBoundingClientRect().x}
          >
            {allFilters.map((filter) => (
              <FilterRow key={filter}>
                <Text $short={{ variant: 'buttonLabel4' }} variant="subheading2">
                  {filter}
                </Text>
                <Checkbox
                  checked={activeFilter.includes(filter)}
                  variant="branded"
                  onPress={() => handleFilterOptionClick(filter)}
                />
              </FilterRow>
            ))}
          </FilterDropdown>
        </Portal>
      )}
    </>
  )
}
