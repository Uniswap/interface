import gql from 'graphql-tag'

gql`
  query NftRoute(
    $chain: Chain = ETHEREUM
    $senderAddress: String!
    $nftTrades: [NftTradeInput!]!
    $tokenTrades: [TokenTradeInput!]
  ) {
    nftRoute(chain: $chain, senderAddress: $senderAddress, nftTrades: $nftTrades, tokenTrades: $tokenTrades) {
      calldata
      route {
        amount
        contractAddress
        id
        marketplace
        price {
          currency
          value
        }
        quotePrice {
          currency
          value
        }
        tokenId
        tokenType
      }
      sendAmount {
        currency
        value
      }
      toAddress
    }
  }
`
