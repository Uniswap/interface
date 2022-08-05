import React from 'react'

import Modal from 'components/Modal'
import Chart from 'pages/TrueSight/components/Chart'
import { FormattedCoinGeckoChartData } from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight/index'

const MobileChartModal = ({
  isOpen,
  setIsOpen,
  chartData,
  isLoading,
  chartCategory,
  setChartCategory,
  chartTimeframe,
  setChartTimeframe,
}: {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  chartData: FormattedCoinGeckoChartData
  isLoading: boolean
  chartCategory: TrueSightChartCategory
  setChartCategory: React.Dispatch<React.SetStateAction<TrueSightChartCategory>>
  chartTimeframe: TrueSightTimeframe
  setChartTimeframe: React.Dispatch<React.SetStateAction<TrueSightTimeframe>>
}) => {
  return (
    <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} maxWidth={9999}>
      <Chart
        chartData={chartData}
        isLoading={isLoading}
        chartCategory={chartCategory}
        setChartCategory={setChartCategory}
        chartTimeframe={chartTimeframe}
        setChartTimeframe={setChartTimeframe}
      />
    </Modal>
  )
}

export default MobileChartModal
