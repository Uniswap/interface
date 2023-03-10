import gql from 'graphql-tag'

gql`
  query NftRoute(
    $chain: Chain = ETHEREUM
    $senderAddress: String!
    $nftTrades: [NftTradeInput!]!
    $tokenTrades: [TokenTradeInput!]
  ) {
    nftRoute(chain: $chain, senderAddress: $senderAddress, nftTrades: $nftTrades, tokenTrades: $tokenTrades) {
      id
      calldata
      route {
        amount
        contractAddress
        id
        marketplace
        price {
          id
          currency
          value
        }
        quotePrice {
          id
          currency
          value
        }
        tokenId
        tokenType
      }
      sendAmount {
        id
        currency
        value
      }
      toAddress
    }
  }
`
