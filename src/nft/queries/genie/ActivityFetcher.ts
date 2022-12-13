import { ActivityEventResponse, ActivityFilter } from '../../types'

export const ActivityFetcher = async (
  contractAddress: string,
  filters?: ActivityFilter,
  cursor?: string,
  limit?: string
): Promise<ActivityEventResponse> => {
  const filterParam =
    filters && filters.eventTypes
      ? `&event_types=${filters.eventTypes?.map((eventType) => `${eventType}`).join(',')}`
      : ''

  const tokenId = filters?.token_id ? `&token_id=${filters?.token_id}` : ''

  const url = `${process.env.REACT_APP_TEMP_API_URL}/nft/collections/${contractAddress}/activity?limit=${
    limit ? limit : '25'
  }${filterParam}${cursor ? `&cursor=${cursor}` : ''}${tokenId}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await r.json()
  return data.data
}
