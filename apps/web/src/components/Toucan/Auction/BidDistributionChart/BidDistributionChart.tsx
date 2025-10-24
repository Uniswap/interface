import { BidDistributionChartHeader } from 'components/Toucan/Auction/BidDistributionChart/BidDistributionChartHeader'
import { Flex } from 'ui/src'

export const BidDistributionChart = () => {
  return (
    <Flex maxWidth={720} width="62%">
      <BidDistributionChartHeader />
    </Flex>
  )
}
