import { ParentSize } from '@visx/responsive'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { Row } from 'nft/components/Flex'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { ActivityChartTestData } from './ActivityChartTestData'
import { ActivityGraph } from './ActivityGraph'
import { SupportedTimePeriodsType, TimePeriodSwitcher } from './TimePeriodSwitcher'

const TableContentContainer = styled(Row)`
  height: 568px;
  justify-content: space-between;
  align-items: flex-start;
`

const activityHistory = ActivityChartTestData.priceHistory

export const ActivityTableContent = () => {
  const [timePeriod, setTimePeriod] = useState<SupportedTimePeriodsType>(HistoryDuration.Week)

  return (
    <TableContentContainer>
      <ParentSize>{({ width }) => <ActivityGraph prices={activityHistory} width={width} height={276} />}</ParentSize>
      <TimePeriodSwitcher activeTimePeriod={timePeriod} setTimePeriod={setTimePeriod} />
    </TableContentContainer>
  )
}
