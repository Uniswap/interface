import { ActivityEventResponse, ActivityFilter } from '../../types'

export const ActivityFetcher = async (
  contractAddress: string,
  filters?: ActivityFilter,
  cursor?: string
): Promise<ActivityEventResponse> => {
  const filterParam =
    filters && filters.eventTypes
      ? `&${filters.eventTypes?.map((eventType) => `event_types[]=${eventType}`).join('&')}`
      : ''
  const url = `${
    process.env.REACT_APP_GENIE_V3_API_URL
  }/collections/${contractAddress}/activity?limit=25${filterParam}${cursor ? `&cursor=${cursor}` : ''}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await r.json()
  return data.data
}
