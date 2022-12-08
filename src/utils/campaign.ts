import { APP_PATHS } from 'constants/index'

import { convertToSlug } from './string'

// url format: name-in-slug-format-campaignId
export const getSlugUrlCampaign = (id: number, name: string) =>
  `${APP_PATHS.CAMPAIGN}/${convertToSlug(`${name}-${id}`)}`

export const getCampaignIdFromSlug = (slug: string) => slug.split('-').pop()
