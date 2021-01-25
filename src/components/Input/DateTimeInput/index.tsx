import { DateTime } from 'luxon'
import React from 'react'
import Datepicker from 'react-datepicker'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../theme'
import { StyledInput } from '../styleds'

const Input = styled(StyledInput)`
  position: relative;
  border: solid 1px ${props => props.theme.bg5};
  border-radius: 8px;
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  line-height: 11px;
  letter-spacing: 0.08em;
  height: 30px;
  padding-left: 12px;
  padding-right: 12px;
  color: ${props => props.theme.text5};
  text-transform: uppercase;
  font-weight: 600;
  font-size: 11px;
  line-height: 11px;
`

const StyledDay = styled.span`
  font-family: Montserrat;
  font-size: 11px;
  color: ${props => props.theme.text5};
`

interface CustomHeaderProps {
  date: Date
  decreaseMonth: () => void
  increaseMonth: () => void
}

const CustomHeader = function({ date, decreaseMonth, increaseMonth }: CustomHeaderProps) {
  return (
    <Flex px="12px" pt="8px" flexDirection="row" justifyContent="space-between" alignItems="center">
      <Box>
        <ChevronLeft size={12} onClick={decreaseMonth} />
      </Box>
      <Box>
        <TYPE.body fontWeight="600" color="text4" letterSpacing="0.08em">
          {DateTime.fromJSDate(date).toFormat('DDD')}
        </TYPE.body>
      </Box>
      <Box>
        <ChevronRight size={12} onClick={increaseMonth} />
      </Box>
    </Flex>
  )
}

interface PickerProps {
  value: Date | null
  onChange: (date: Date) => void
  placeholder: string
  minimum?: Date
  maximum?: Date
}

function DateTimeInput({ value, placeholder, minimum, maximum, onChange }: PickerProps) {
  return (
    <Datepicker
      customInput={<Input />}
      dateFormat="dd-MM-yyyy hh:mm"
      renderCustomHeader={props => <CustomHeader {...props} />}
      renderDayContents={(day: number) => {
        return <StyledDay>{day}</StyledDay>
      }}
      placeholderText={placeholder}
      selected={value}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      minTime={minimum}
      maxTime={maximum}
    />
  )
}

export default DateTimeInput
