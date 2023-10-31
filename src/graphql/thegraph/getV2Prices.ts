import { PricePoint } from 'graphql/data/util'
export async function getV2Prices(tokenAddress: string): Promise<PricePoint[] | undefined> {
  const requestBody = `
    query tokenDayDatas {
      tokenDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { token: "${tokenAddress.toLowerCase()}" }) {
        id
        date
        priceUSD
        totalLiquidityToken
        totalLiquidityUSD
        totalLiquidityETH
        dailyVolumeETH
        dailyVolumeToken
        dailyVolumeUSD
      }
    }
  `

  try {
    const data = await fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev', {
      method: 'POST',
      body: JSON.stringify({ query: requestBody }),
    })

    const response = await data.json()
    const pricePoints: PricePoint[] = []
    response.data.tokenDayDatas?.map((day: any) => {
      pricePoints.push({ timestamp: day.date, value: day.priceUSD })
    })
    return pricePoints
  } catch (e) {
    console.log('cartcrom', 'v2 prices error', e)
    return []
  }
}
