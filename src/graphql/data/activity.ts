import { ActivityQuery } from './__generated__/types-and-hooks'

type Portfolio = NonNullable<ActivityQuery['portfolios']>[number]
export type AssetActivity = NonNullable<Portfolio['assetActivities']>[number]
export type AssetActivityDetails = AssetActivity['details']
