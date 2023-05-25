import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { TimePeriodSwitcher } from './TimePeriodSwitcher'

const TableContentContainer = styled.div`
  height: 568px;
  position: relative;
`

const SwitcherWrapper = styled.div`
  position: absolute;
  right: 0;
  top: -36px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    top: 0px;
  }
`

export const ActivityTableContent = () => {
  const [timePeriod, setTimePeriod] = useState<HistoryDuration>(HistoryDuration.Week)
  return (
    <TableContentContainer>
      <SwitcherWrapper>
        <TimePeriodSwitcher activeTimePeriod={timePeriod} setTimePeriod={setTimePeriod} />
      </SwitcherWrapper>
      Activity Content
    </TableContentContainer>
  )
}
