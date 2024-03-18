/* eslint-disable max-lines */
import {
  Chain,
  Currency,
  NftStandard,
  TransactionType as RemoteTransactionType,
  TokenStandard,
  TransactionDirection,
  TransactionStatus,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getNativeAddress, getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI } from 'wallet/src/constants/tokens'
import {
  NFTTradeType,
  TransactionListQueryResponse,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'wallet/src/test/fixtures'
import extractTransactionDetails from './extractTransactionDetails'
import parseApproveTransaction from './parseApproveTransaction'
import parseNFTMintTransaction from './parseMintTransaction'
import parseReceiveTransaction from './parseReceiveTransaction'
import parseSendTransaction from './parseSendTransaction'
import parseTradeTransaction from './parseTradeTransaction'

/**
 * Testing for API transaction parsing utils.
 */

const ASSET_CHANGE_ID = 'TEST_ID'
const FROM_ADDRESS = SAMPLE_SEED_ADDRESS_1
const TO_ADDRESS = SAMPLE_SEED_ADDRESS_2
const TEST_HASH = '0x00'
const ERC20_ASSET_ADDRESS = DAI.address
const WRAPPED_NATIVE_ADDRESS = getWrappedNativeAddress(ChainId.Mainnet)

const RESPONSE_BASE = {
  id: 'base_id',
  chain: Chain.Ethereum,
  timestamp: 1,
  details: {
    __typename: 'TransactionDetails' as const,
    id: 'base_tranaction_id',
    hash: TEST_HASH,
    status: TransactionStatus.Confirmed,
    to: TO_ADDRESS,
    from: FROM_ADDRESS,
    assetChanges: [], // override per test
    type: RemoteTransactionType.Unknown, // override per test.
  },
}

/** Asset change response mocks */

const ERC20_APPROVE_ASSET_CHANGE = {
  id: ASSET_CHANGE_ID,
  asset: {
    id: 'asset_id',
    name: 'asset_name',
    symbol: 'asset_symbol',
    decimals: 18,
    address: ERC20_ASSET_ADDRESS,
    chain: Chain.Ethereum,
  },
  tokenStandard: TokenStandard.Erc20,
  approvedAddress: 'approved_address',
  quantity: '1',
}

const ERC20_TRANSFER_OUT_ASSET_CHANGE = {
  id: ASSET_CHANGE_ID,
  asset: {
    id: 'asset_id',
    name: 'asset_name',
    symbol: 'asset_symbol',
    decimals: 18,
    address: ERC20_ASSET_ADDRESS,
    chain: Chain.Ethereum,
  },
  tokenStandard: TokenStandard.Erc20,
  quantity: '1',
  sender: FROM_ADDRESS,
  recipient: TO_ADDRESS,
  direction: TransactionDirection.Out,
  transactedValue: {
    id: 'transacted_value_id',
    currency: Currency.Usd,
    value: 1,
  },
}

const ERC20_TRANSFER_IN_ASSET_CHANGE = {
  ...ERC20_TRANSFER_OUT_ASSET_CHANGE,
  direction: TransactionDirection.In,
}

const ERC20_WRAPPED_TRANSFER_IN_ASSET_CHANGE = {
  ...ERC20_TRANSFER_OUT_ASSET_CHANGE,
  asset: {
    ...ERC20_TRANSFER_OUT_ASSET_CHANGE.asset,
    address: WRAPPED_NATIVE_ADDRESS,
  },
  direction: TransactionDirection.In,
}

const NATIVE_TRANSFER_OUT_ASSET_CHANGE = {
  ...ERC20_TRANSFER_OUT_ASSET_CHANGE,
  asset: {
    ...ERC20_TRANSFER_OUT_ASSET_CHANGE.asset,
    address: getNativeAddress(ChainId.Mainnet),
  },
  tokenbStandard: TokenStandard.Native,
}

const ERC721_TRANSFER_IN_ASSET_CHANGE = {
  id: ASSET_CHANGE_ID,
  asset: {
    id: 'asset_id',
    name: 'asset_name',
    isSpam: false,
    nftContract: {
      id: 'nft_contract_id',
      chain: Chain.Ethereum,
      address: 'nft_contract_address',
    },
    tokenId: 'token_id',
    image: {
      id: 'nft_image_id',
      url: 'image_url',
    },
    collection: {
      id: 'collection_id',
      name: 'collection_name',
    },
  },
  nftStandard: NftStandard.Erc721,
  sender: FROM_ADDRESS,
  recipient: TO_ADDRESS,
  direction: TransactionDirection.In,
}

const ERC721_TRANSFER_OUT_ASSET_CHANGE = {
  ...ERC721_TRANSFER_IN_ASSET_CHANGE,
  direction: TransactionDirection.Out,
}

/** ERC20 Approve */

const MOCK_ERC20_APPROVE: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Approve,
    assetChanges: [{ ...ERC20_APPROVE_ASSET_CHANGE, __typename: 'TokenApproval' }],
  },
}

describe(parseApproveTransaction, () => {
  it('ERC20 approve: handle empty asset changes', () => {
    expect(parseApproveTransaction(RESPONSE_BASE)).toBeUndefined()
  })
  it('ERC20 approve: parse valid approval', () => {
    expect(parseApproveTransaction(MOCK_ERC20_APPROVE)).toEqual({
      type: TransactionType.Approve,
      tokenAddress: ERC20_ASSET_ADDRESS,
      spender: 'approved_address',
      approvalAmount: '1',
    })
  })
})

/** ERC721 Mint  */

const MOCK_721_MINT: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Mint,
    assetChanges: [
      { ...ERC721_TRANSFER_IN_ASSET_CHANGE, __typename: 'NftTransfer' },
      { ...ERC20_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

const MOCK_721_MINT_WTIH_NATIVE: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Mint,
    assetChanges: [
      { ...ERC721_TRANSFER_IN_ASSET_CHANGE, __typename: 'NftTransfer' },
      { ...NATIVE_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

describe(parseNFTMintTransaction, () => {
  it('NFT Mint: handle empty asset changes', () => {
    expect(parseNFTMintTransaction(RESPONSE_BASE)).toBeUndefined()
  })
  it('NFT Mint: parse 721 mint purchased with ERC20', () => {
    expect(parseNFTMintTransaction(MOCK_721_MINT)).toEqual({
      type: TransactionType.NFTMint,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'token_id',
      },
      purchaseCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      purchaseCurrencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
      isSpam: false,
    })
  })
  it('NFT Mint: parse 721 mint purchased with native asset', () => {
    expect(parseNFTMintTransaction(MOCK_721_MINT_WTIH_NATIVE)).toEqual({
      type: TransactionType.NFTMint,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'token_id',
      },
      purchaseCurrencyId: `1-${getNativeAddress(ChainId.Mainnet)}`,
      purchaseCurrencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
      isSpam: false,
    })
  })
})

/** Receive */

const MOCK_ERC20_RECEIVE: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Receive,
    assetChanges: [{ ...ERC20_TRANSFER_IN_ASSET_CHANGE, __typename: 'TokenTransfer' }],
  },
}

const MOCK_ERC20_RECEIVE_SPAM: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Receive,
    assetChanges: [
      {
        ...ERC20_TRANSFER_IN_ASSET_CHANGE,
        asset: {
          ...ERC20_TRANSFER_IN_ASSET_CHANGE.asset,
          project: { id: 'project_id', isSpam: true },
        },
        __typename: 'TokenTransfer',
      },
    ],
  },
}

const MOCK_ERC721_RECEIVE: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Receive,
    assetChanges: [{ ...ERC721_TRANSFER_IN_ASSET_CHANGE, __typename: 'NftTransfer' }],
  },
}

describe(parseReceiveTransaction, () => {
  it('Receive : handle empty asset changes', () => {
    expect(parseReceiveTransaction(RESPONSE_BASE)).toBeUndefined()
  })
  it('Receive: parse ERC20 receive', () => {
    expect(parseReceiveTransaction(MOCK_ERC20_RECEIVE)).toEqual({
      type: TransactionType.Receive,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      sender: FROM_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
      isSpam: false,
    })
  })
  it('Receive: parse spam ERC20 receive', () => {
    expect(parseReceiveTransaction({ ...MOCK_ERC20_RECEIVE_SPAM })).toEqual({
      type: TransactionType.Receive,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      sender: FROM_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
      isSpam: true,
    })
  })
  it('Receive: parse ERC721 receive', () => {
    expect(parseReceiveTransaction(MOCK_ERC721_RECEIVE)).toEqual({
      type: TransactionType.Receive,
      assetType: 'erc-721',
      tokenAddress: 'nft_contract_address',
      sender: FROM_ADDRESS,
      isSpam: false,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'token_id',
      },
    })
  })
})

/** Send */

const MOCK_ERC20_SEND: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Send,
    assetChanges: [{ ...ERC20_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' }],
  },
}

const MOCK_ERC721_SEND: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Send,
    assetChanges: [{ ...ERC721_TRANSFER_OUT_ASSET_CHANGE, __typename: 'NftTransfer' }],
  },
}

describe(parseSendTransaction, () => {
  it('Send : handle empty asset changes', () => {
    expect(parseSendTransaction(RESPONSE_BASE)).toBeUndefined()
  })
  it('Send: parse ERC20 send', () => {
    expect(parseSendTransaction(MOCK_ERC20_SEND)).toEqual({
      type: TransactionType.Send,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      recipient: TO_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
      isSpam: false,
    })
  })
  it('Send: parse ERC721 send', () => {
    expect(parseSendTransaction(MOCK_ERC721_SEND)).toEqual({
      type: TransactionType.Send,
      assetType: 'erc-721',
      tokenAddress: 'nft_contract_address',
      recipient: TO_ADDRESS,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'token_id',
      },
    })
  })
})

/** Swaps */

const MOCK_ERC20_SWAP: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Swap,
    assetChanges: [
      { ...ERC20_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
      { ...ERC20_TRANSFER_IN_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

const MOCK_NATIVE_SWAP: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Swap,
    assetChanges: [
      { ...NATIVE_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
      { ...ERC20_TRANSFER_IN_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

/** NFT Purchase and Sell */

const MOCK_NFT_BUY: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Swap,
    assetChanges: [
      { ...ERC721_TRANSFER_IN_ASSET_CHANGE, __typename: 'NftTransfer' },
      { ...ERC20_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}
const MOCK_NFT_SELL: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Swap,
    assetChanges: [
      { ...ERC721_TRANSFER_OUT_ASSET_CHANGE, __typename: 'NftTransfer' },
      { ...ERC20_TRANSFER_IN_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

const MOCK_NATIVE_WRAP: TransactionListQueryResponse = {
  ...RESPONSE_BASE,
  details: {
    ...RESPONSE_BASE.details,
    type: RemoteTransactionType.Swap,
    assetChanges: [
      { ...NATIVE_TRANSFER_OUT_ASSET_CHANGE, __typename: 'TokenTransfer' },
      { ...ERC20_WRAPPED_TRANSFER_IN_ASSET_CHANGE, __typename: 'TokenTransfer' },
    ],
  },
}

describe(parseTradeTransaction, () => {
  it('Swap : handle empty asset changes', () => {
    expect(parseTradeTransaction(RESPONSE_BASE)).toBeUndefined()
  })
  it('Swap: parse token swap', () => {
    expect(parseTradeTransaction(MOCK_ERC20_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      transactedUSDValue: 1,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1000000000000000000',
    })
  })
  it('Swap: parse native swap', () => {
    expect(parseTradeTransaction(MOCK_NATIVE_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${getNativeAddress(ChainId.Mainnet)}`,
      outputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      transactedUSDValue: 1,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1000000000000000000',
    })
  })
  it('Swap: parse wrap', () => {
    expect(parseTradeTransaction(MOCK_NATIVE_WRAP)).toEqual({
      type: TransactionType.Wrap,
      unwrapped: false,
      currencyAmountRaw: '1000000000000000000',
    })
  })
  it('Swap: parse NFT buy', () => {
    expect(parseTradeTransaction(MOCK_NFT_BUY)).toEqual({
      type: TransactionType.NFTTrade,
      tradeType: NFTTradeType.BUY,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'asset_name',
      },
      purchaseCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      purchaseCurrencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
    })
  })
  it('Swap: parse NFT sell', () => {
    expect(parseTradeTransaction(MOCK_NFT_SELL)).toEqual({
      type: TransactionType.NFTTrade,
      tradeType: NFTTradeType.SELL,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'asset_name',
      },
      purchaseCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      purchaseCurrencyAmountRaw: '1000000000000000000',
      transactedUSDValue: 1,
    })
  })
})

/**
 * Parent extraction util
 */

describe(extractTransactionDetails, () => {
  it('Empty transaction', () => {
    expect(extractTransactionDetails(null)).toEqual(null)
  })
  it('Approve', () => {
    const txn = extractTransactionDetails(MOCK_ERC20_APPROVE)
    expect(txn?.typeInfo.type).toEqual(TransactionType.Approve)
  })
  it('Send', () => {
    const txn = extractTransactionDetails(MOCK_ERC20_SEND)
    expect(txn?.typeInfo.type).toEqual(TransactionType.Send)
  })
  it('Receive', () => {
    const txn = extractTransactionDetails(MOCK_ERC20_RECEIVE)
    expect(txn?.typeInfo.type).toEqual(TransactionType.Receive)
  })
  it('Swap token', () => {
    const txn = extractTransactionDetails(MOCK_ERC20_SWAP)
    expect(txn?.typeInfo.type).toEqual(TransactionType.Swap)
  })
  it('NFT buy', () => {
    const txn = extractTransactionDetails(MOCK_NFT_BUY)
    expect(txn?.typeInfo.type).toEqual(TransactionType.NFTTrade)
  })
  it('Mint', () => {
    const txn = extractTransactionDetails(MOCK_721_MINT)
    expect(txn?.typeInfo.type).toEqual(TransactionType.NFTMint)
  })
  it('Unknown', () => {
    const txn = extractTransactionDetails(RESPONSE_BASE)
    expect(txn?.typeInfo.type).toEqual(TransactionType.Unknown)
  })
})
