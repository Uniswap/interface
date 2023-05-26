import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { Row } from 'nft/components/Flex'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { SupportedTimePeriodsType, TimePeriodSwitcher } from './TimePeriodSwitcher'

const TableContentContainer = styled(Row)`
  height: 568px;
  justify-content: space-between;
  align-items: flex-start;
`

export const ActivityTableContent = () => {
  const [timePeriod, setTimePeriod] = useState<SupportedTimePeriodsType>(HistoryDuration.Week)
  return (
    <TableContentContainer>
      <span>Activity Content</span>
      <TimePeriodSwitcher activeTimePeriod={timePeriod} setTimePeriod={setTimePeriod} />
    </TableContentContainer>
  )
}
