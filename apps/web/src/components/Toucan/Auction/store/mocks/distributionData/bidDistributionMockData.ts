// TODO | Toucan: Remove this file once live auction data is implemented
// This file contains mock data for testing the BidDistributionChart with different data sets

import { MOCK_BID_DISTRIBUTION_DATA_10_TICKS } from 'components/Toucan/Auction/store/mocks/distributionData/10_Ticks'
import { MOCK_BID_DISTRIBUTION_DATA_20_TICKS } from 'components/Toucan/Auction/store/mocks/distributionData/20_Ticks'
import { MOCK_BID_DISTRIBUTION_DATA_50_TICKS } from 'components/Toucan/Auction/store/mocks/distributionData/50_Ticks'
import { MOCK_BID_DISTRIBUTION_DATA_100_TICKS } from 'components/Toucan/Auction/store/mocks/distributionData/100_Ticks'
import { BidDistributionData } from 'components/Toucan/Auction/store/types'

export const MOCK_BID_DISTRIBUTION_DATASETS: BidDistributionData[] = [
  MOCK_BID_DISTRIBUTION_DATA_10_TICKS,
  MOCK_BID_DISTRIBUTION_DATA_20_TICKS,
  MOCK_BID_DISTRIBUTION_DATA_50_TICKS,
  MOCK_BID_DISTRIBUTION_DATA_100_TICKS,
]
