import { graphql } from 'babel-plugin-relay/macro'
import { useLazyLoadQuery } from 'react-relay'
import { PollingInterval } from 'src/constants/misc'
import {
  hooksNftQuery,
  hooksNftQuery$data,
} from 'src/features/nfts/__generated__/hooksNftQuery.graphql'

const nftsQuery = graphql`
  query hooksNftQuery($ownerAddress: String!) {
    portfolios(ownerAddresses: [$ownerAddress]) {
      nftBalances {
        ownedAsset {
          collection @required(action: LOG) {
            collectionId @required(action: LOG)
            description
            image {
              url
            }
            isVerified
            name
            numAssets
            markets(currencies: [USD]) {
              floorPrice {
                value
              }
              owners
              volume24h {
                value
              }
              totalVolume {
                value
              }
            }
          }
          description
          image {
            url
          }
          name
          nftContract @required(action: LOG) {
            address @required(action: LOG)
            chain @required(action: LOG)
            standard
          }
          thumbnail {
            url
          }
          tokenId @required(action: LOG)
          creator {
            address
            username
          }
        }
      }
    }
  }
`

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<hooksNftQuery$data['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

// TODO(MOB-3390): deprecate this hook in favor of component queries
export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): GQLNftAsset | undefined {
  const data = useLazyLoadQuery<hooksNftQuery>(
    nftsQuery,
    { ownerAddress: owner },
    { networkCacheConfig: { poll: PollingInterval.Slow } }
  )

  return data.portfolios?.[0]?.nftBalances?.find(
    (balance) =>
      balance?.ownedAsset?.nftContract?.address === address &&
      balance?.ownedAsset?.tokenId === tokenId
  )?.ownedAsset
}
