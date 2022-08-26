import { TokenPriceSingleQuery$data } from './__generated__/TokenPriceSingleQuery.graphql'

export type PriceHistory = NonNullable<
  NonNullable<NonNullable<NonNullable<TokenPriceSingleQuery$data['tokenProjects']>[number]>['markets']>[number]
>['priceHistory']
