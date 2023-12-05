import { NftCollectionScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'

export type NFTCollectionData = Maybe<
  NonNullable<NonNullable<NftCollectionScreenQuery['nftCollections']>['edges']>[0]['node']
>
