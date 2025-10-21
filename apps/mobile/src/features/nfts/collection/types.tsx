import { NftCollectionScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export type NFTCollectionData = Maybe<
  NonNullable<NonNullable<NftCollectionScreenQuery['nftCollections']>['edges']>[0]['node']
>
