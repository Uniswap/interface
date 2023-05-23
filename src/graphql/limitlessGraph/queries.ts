import {gql} from "@apollo/client"

export const POOL_STATS_QUERY = gql`
query poolHourDatas($startTime: Int!, $address: String!) {
  poolHourDatas(
    where: { pool: $address, periodStartUnix_gt: $startTime }
    orderBy: periodStartUnix
    orderDirection: asc
  ) {
    periodStartUnix
    token0Price
    token1Price
    volumeToken0
    volumeToken1
    high
    low
  }
}
`