import { ParentSize } from '@visx/responsive'
import Column from 'components/Column'
import Row from 'components/Row'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ActivityChartTestData } from './ActivityChartTestData'
import { ActivityGraph } from './ActivityGraph'
import { containerHorizontalPadding } from './shared'
import { SupportedTimePeriodsType, TimePeriodSwitcher } from './TimePeriodSwitcher'

const TableContentContainer = styled(Column)`
  height: 568px;
`

const TableHeaderContainer = styled(Row)`
  justify-content: space-between;
  align-items: flex-start;

  ${containerHorizontalPadding}
`

const activityHistory = ActivityChartTestData.priceHistory

export const ActivityTableContent = () => {
  const [timePeriod, setTimePeriod] = useState<SupportedTimePeriodsType>(HistoryDuration.Week)

  return (
    <TableContentContainer gap="lg">
      <TableHeaderContainer>
        <ThemedText.SubHeaderSmall lineHeight="20px">vs. collection floor</ThemedText.SubHeaderSmall>
        <TimePeriodSwitcher activeTimePeriod={timePeriod} setTimePeriod={setTimePeriod} />
      </TableHeaderContainer>
      <ParentSize>
        {({ width }) => <ActivityGraph prices={activityHistory} width={width} height={276} timePeriod={timePeriod} />}
      </ParentSize>
    </TableContentContainer>
  )
}
