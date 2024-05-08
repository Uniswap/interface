import Column from 'components/Column'
import Row from 'components/Row'
import { DropdownIcon } from 'components/Table/icons'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useScreenSize } from 'hooks/useScreenSize'
import { Portal } from 'nft/components/common/Portal'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { Fragment, useCallback, useRef, useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

const StyledDropdownIcon = styled(DropdownIcon)`
  position: relative;
`
const FilterDropdown = styled(Column)<{ isSticky?: boolean }>`
  position: absolute;
  top: ${({ isSticky }) => (isSticky ? 64 : 42)}px;
  padding: 8px;
  border-radius: 12px;
  background: ${({ theme }) => theme.surface2};
  gap: 8px;
  width: 240px;
  border-radius: 12px;
  border: ${({ theme }) => `1px solid ${theme.surface3}`};
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  opacity: 1 !important;
  z-index: ${Z_INDEX.modal};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    position: fixed;
    bottom: 0;
    left: 0;
    top: unset;
    width: 100vw;
  }
`

const FilterRow = styled(Row)`
  padding: 10px 8px;
  justify-content: space-between;
  border-radius: 8px;
  &:hover {
    background: ${({ theme }) => theme.surface3};
  }
`

interface FilterProps<T extends string> {
  allFilters: T[]
  activeFilter: T[]
  setFilters: (filter: T[]) => void
  isOpen: boolean
  toggleFilterModal: () => void
  isSticky?: boolean
}

export function Filter<T extends string>({
  allFilters,
  activeFilter,
  setFilters,
  isOpen,
  toggleFilterModal,
  isSticky,
}: FilterProps<T>) {
  const [hoveredRow, setHoveredRow] = useState(-1)
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
    [activeFilter, setFilters]
  )
  // Need to put the modal in a Portal when on mobile to show over promo banner
  const Wrapper = isMobile ? Portal : Fragment

  return (
    <>
      <StyledDropdownIcon />
      {isOpen && (
        <Wrapper>
          <FilterDropdown isSticky={isSticky} ref={filterModalRef}>
            {allFilters.map((filter, index) => (
              <FilterRow
                key={filter}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleFilterOptionClick(filter)
                }}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(-1)}
              >
                <ThemedText.BodySecondary>{filter}</ThemedText.BodySecondary>
                <Checkbox checked={activeFilter.includes(filter)} hovered={index === hoveredRow} size={20} />
              </FilterRow>
            ))}
          </FilterDropdown>
        </Wrapper>
      )}
    </>
  )
}
