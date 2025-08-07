import { NftsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']
