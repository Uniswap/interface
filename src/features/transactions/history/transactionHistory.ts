import { graphql } from 'babel-plugin-relay/macro'
import { useLazyLoadQuery } from 'react-relay'
import { transactionHistoryQuery as transactionHistoryQueryShape } from 'src/features/transactions/history/__generated__/transactionHistoryQuery.graphql'

const transactionHistoryQuery = graphql`
  query transactionHistoryQuery($address: String!, $ps: Int, $page: Int) {
    assetActivities(address: $address, pageSize: $ps, page: $page) {
      timestamp
      type
      transaction {
        hash
        status
        to
        from
      }
      assetChanges {
        __typename
        ... on TokenTransfer {
          asset {
            name
            symbol
            address
            decimals
            chain
          }
          tokenStandard
          quantity
          sender
          recipient
          direction
          transactedValue {
            currency
            value
          }
        }
        ... on NftTransfer {
          asset {
            name
            nftContract {
              chain
              address
            }
            tokenId
            imageUrl
            collection {
              name
            }
          }
          nftStandard
          sender
          recipient
          direction
        }
        ... on TokenApproval {
          asset {
            name
            symbol
            decimals
            address
            chain
          }
          tokenStandard
          approvedAddress
          quantity
        }
      }
    }
  }
`

export function useTransactionHistoryForOwner(owner: Nullable<Address>) {
  return useLazyLoadQuery<transactionHistoryQueryShape>(transactionHistoryQuery, {
    address: owner ?? '',
    ps: 50,
    page: 1,
  })
}

// Derive the type of return data from history query
type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[] ? ElementType : never
export type TransactionHistoryResponse = ArrElement<
  ReturnType<typeof useTransactionHistoryForOwner>['assetActivities']
>
