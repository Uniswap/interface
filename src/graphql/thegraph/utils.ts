import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import ms from 'ms'

// TODO(WEB-2878): See if splitQuery can be replaced with proper Apollo usage
/**
 * Used to get large amounts of data when larger than the Apollo limit
 * Splits query into multiple queries and returns the combined data
 * @param query - the query to be split
 * @param localClient - Apollo client for a specific chain
 * @param vars - any variables that are passed in every query
 * @param values - the keys that are used as the values to map over if
 * @param skipCount - amount of entities to skip per query
 */
export async function splitQuery<Type extends object>(
  query: any,
  client: ApolloClient<NormalizedCacheObject>,
  vars: any[],
  values: any[],
  skipCount = 1000
) {
  let fetchedData = {}
  let allFound = false
  let skip = 0
  try {
    while (!allFound) {
      let end = values.length
      if (skip + skipCount < values.length) {
        end = skip + skipCount
      }
      const sliced = values.slice(skip, end)
      const result = await client.query<Type>({
        query: query(...vars, sliced),
        fetchPolicy: 'network-only',
      })
      fetchedData = {
        ...fetchedData,
        ...result.data,
      }
      if (Object.keys(result.data).length < skipCount || skip + skipCount > values.length) {
        allFound = true
      } else {
        skip += skipCount
      }
    }
    return fetchedData
  } catch (e) {
    console.log(e)
    return undefined
  }
}

/**
 * Get the 24hr, 48hr, and 1 week ago timestamps
 * @returns [t24, t48, tWeek]
 */
export function useDeltaTimestamps(): [number, number, number] {
  const utcCurrentTime = Date.now()
  const t24 = Math.floor((utcCurrentTime - ms('1d')) / 1000)
  const t48 = Math.floor((utcCurrentTime - ms('2d')) / 1000)
  const tWeek = Math.floor((utcCurrentTime - ms('7d')) / 1000)
  return [t24, t48, tWeek]
}

/**
 * gets the amount difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 * @param {*} value48HoursAgo
 */
export const get2DayChange = (valueNow: string, value24HoursAgo: string, value48HoursAgo: string): [number, number] => {
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)
  const previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo)
  const adjustedPercentChange = ((currentChange - previousChange) / previousChange) * 100
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0]
  }
  return [currentChange, adjustedPercentChange]
}
