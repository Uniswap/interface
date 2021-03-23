import React, { useCallback } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import Radio from '../../Radio'

export enum PairsFilterType {
  ALL = 'ALL',
  REWARDS = 'REWARDS'
}

const StyledRoot = styled(Flex)<{ disabled?: boolean }>`
  opacity: ${props => (props.disabled ? 0.2 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
`

interface ListFilterProps {
  filter: PairsFilterType
  disabled?: boolean
  onFilterChange: (newFilter: PairsFilterType) => void
}

export default function ListFilter({ disabled, filter, onFilterChange }: ListFilterProps) {
  const handleFilterRadioChange = useCallback(
    event => {
      onFilterChange(PairsFilterType[event.target.value as keyof typeof PairsFilterType])
    },
    [onFilterChange]
  )

  return (
    <StyledRoot justifyContent="space-between" disabled={disabled}>
      <Flex flex="1" flexWrap="wrap">
        <Box mb={['8px', '0px']} mr="20px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.ALL}
            label="All pairs"
            value={PairsFilterType.ALL.toString()}
          />
        </Box>
        <Box mr="20px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.REWARDS}
            label="With rewards"
            value={PairsFilterType.REWARDS.toString()}
          />
        </Box>
      </Flex>
      <Box>
        <Text fontSize="11px" fontWeight="600" lineHeight="11px" letterSpacing="0.08em">
          SORTING: RELEVANCE
        </Text>
      </Box>
    </StyledRoot>
  )
}
