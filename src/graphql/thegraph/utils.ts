import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import ms from 'ms'

/**
 * Used to get large amounts of data when
 * @param query
 * @param localClient
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

export function useDeltaTimestamps(): [number, number, number] {
  const utcCurrentTime = Date.now()
  const t1 = Math.floor((utcCurrentTime - ms('1d')) / 1000)
  const t2 = Math.floor((utcCurrentTime - ms('2d')) / 1000)
  const tWeek = Math.floor((utcCurrentTime - ms('7d')) / 1000)
  return [t1, t2, tWeek]
}
