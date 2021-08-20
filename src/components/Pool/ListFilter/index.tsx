import { useWeb3React } from '@web3-react/core'
import React, { useCallback } from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import Radio from '../../Radio'

export enum PairsFilterType {
  ALL = 'ALL',
  REWARDS = 'REWARDS',
  MY = 'MY'
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
  const { account } = useWeb3React()
  
  const handleFilterRadioChange = useCallback(
    event => {
      onFilterChange(PairsFilterType[event.target.value as keyof typeof PairsFilterType])
    },
    [onFilterChange]
  )

  return (
    <StyledRoot justifyContent="space-between" disabled={disabled}>
      <Flex flex="1" flexWrap="wrap">
        <Box mb={['8px', '0px']} mr="24px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.ALL}
            label="All pairs"
            value={PairsFilterType.ALL.toString()}
          />
        </Box>
        {!!account && (
          <Box mr="24px">
            <Radio
              onChange={handleFilterRadioChange}
              checked={filter === PairsFilterType.MY}
              label="My pairs"
              value={PairsFilterType.MY.toString()}
            />
          </Box>
        )}
        <Box mr="24px">
          <Radio
            onChange={handleFilterRadioChange}
            checked={filter === PairsFilterType.REWARDS}
            label="With rewards"
            value={PairsFilterType.REWARDS.toString()}
          />
        </Box>
      </Flex>
    </StyledRoot>
  )
}
