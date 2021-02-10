import React, { useCallback } from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../theme'
import Radio from '../../Radio'

export enum PairsFilterType {
  ALL,
  REWARDS,
  MY
}

export enum PairsSortingType {
  RELEVANCE,
  MOST_REWARDS
}

const StyledRoot = styled(Flex)<{ disabled?: boolean }>`
  opacity: ${props => (props.disabled ? 0.2 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
`

interface ListFilterProps {
  filter: PairsFilterType
  sorting: PairsSortingType
  disabled?: boolean
  onFilterChange: (newFilter: PairsFilterType) => void
  onSortingChange: (newSorting: PairsSortingType) => void
}

export default function ListFilter({ disabled, filter, sorting, onFilterChange, onSortingChange }: ListFilterProps) {
  const handleFilterRadioChange = useCallback(
    event => {
      onFilterChange(PairsFilterType[event.target.value as keyof typeof PairsFilterType])
    },
    [onFilterChange]
  )

  return (
    <StyledRoot justifyContent="space-between" disabled={disabled}>
      <Flex>
        <Box mr="26px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.ALL}
            label="All pairs"
            value={PairsFilterType.ALL.toString()}
          />
        </Box>
        <Box mr="26px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.REWARDS}
            label="With rewards"
            value={PairsFilterType.REWARDS.toString()}
          />
        </Box>
      </Flex>
      <Box>
        <TYPE.small fontWeight="600" letterSpacing="0.08em">
          SORT BY:
        </TYPE.small>
      </Box>
    </StyledRoot>
  )
}
