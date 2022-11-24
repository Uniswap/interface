import { APP_PATHS } from 'constants/index'
import { CampaignData } from 'state/campaigns/actions'

import { convertToSlug } from './string'

// url format: name-in-slug-format-campaignId
export const getSlugUrlCampaign = (item: CampaignData) =>
  `${APP_PATHS.CAMPAIGN}/${convertToSlug(`${item.name}-${item.id}`)}`

export const getCampaignIdFromSlug = (slug: string) => slug.split('-').pop()
