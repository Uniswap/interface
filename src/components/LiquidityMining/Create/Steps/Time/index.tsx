import React from 'react'
import { Box, Flex } from 'rebass'
import { TYPE } from '../../../../../theme'
import TimeSelector from './TimeSelector'
import Toggle from '../../../../Toggle'
import { Card, Divider } from '../../../styleds'
import styled from 'styled-components'

const FlexContainer = styled(Flex)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

const ResponsiveBoxContainer = styled(Box)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    margin-top: 16px !important;
  `}
`

const ResponsiveFlexContainer = styled(Box)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    margin-top: 16px !important;
  `}
`

interface TimeProps {
  startTime: Date | null
  endTime: Date | null
  timelocked: boolean
  onStartTimeChange: (date: Date) => void
  onEndTimeChange: (date: Date) => void
  onTimelockedChange: () => void
}

export default function Time({
  startTime,
  endTime,
  timelocked,
  onStartTimeChange,
  onEndTimeChange,
  onTimelockedChange
}: TimeProps) {
  return (
    <Card>
      <FlexContainer justifyContent="stretch" width="100%">
        <Box flex="1">
          <TimeSelector
            title="START DATE AND TIME"
            placeholder="Start date & time"
            value={startTime}
            minimum={new Date()}
            onChange={onStartTimeChange}
          />
        </Box>
        <Box mx="18px">
          <Divider />
        </Box>
        <ResponsiveBoxContainer flex="1">
          <TimeSelector
            title="END DATE AND TIME"
            placeholder="End date & time"
            value={endTime}
            minimum={startTime || new Date()}
            onChange={onEndTimeChange}
          />
        </ResponsiveBoxContainer>
        <Box mx="18px">
          <Divider />
        </Box>
        <ResponsiveFlexContainer flexDirection="column">
          <Box mb="16px">
            <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
              TIMELOCK
            </TYPE.small>
          </Box>
          <Box>
            <Toggle isActive={timelocked} toggle={onTimelockedChange} />
          </Box>
        </ResponsiveFlexContainer>
      </FlexContainer>
    </Card>
  )
}
