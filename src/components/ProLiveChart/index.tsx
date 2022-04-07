import React from 'react'
import { AdvancedChart } from 'react-tradingview-embed'
import styled from 'styled-components'

const ProLiveChartWrapper = styled.div`
  margin-top: 16px;
  margin-bottom: 20px;
  min-height: 400px;
`
const ProLiveChart = () => {
  return (
    <ProLiveChartWrapper>
      <AdvancedChart
        widgetProps={{
          theme: 'dark',
          height: '400px',
          toolbar_bg: '#000',
          withdateranges: false,
        }}
        widgetPropsAny={{}}
      />
    </ProLiveChartWrapper>
  )
}

export default React.memo(ProLiveChart)
