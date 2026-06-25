import {
  Direction,
  FiatOnRampTransaction,
  OnChainTransaction,
  OnChainTransactionLabel,
  OnChainTransactionStatus,
  SpamCode as RestSpamCode,
  TokenType,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { getNativeAddress, getWrappedNativeAddressWithThrow } from 'uniswap/src/constants/addresses'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI } from 'uniswap/src/constants/tokens'
import extractRestOnChainTransactionDetails from 'uniswap/src/features/activity/extract/extractOnChainTransactionDetails'
import { parseApproveTransaction } from 'uniswap/src/features/activity/parse/parseApproveTransaction'
import { parseLiquidityTransaction } from 'uniswap/src/features/activity/parse/parseLiquidityTransaction'
import { parseNFTMintTransaction } from 'uniswap/src/features/activity/parse/parseMintTransaction'
import { parseReceiveTransaction } from 'uniswap/src/features/activity/parse/parseReceiveTransaction'
import { parseSendTransaction } from 'uniswap/src/features/activity/parse/parseSendTransaction'
import {
  parseSwapTransaction,
  parseWithdrawTransaction,
  parseWrapTransaction,
  parseDepositTransaction,
} from 'uniswap/src/features/activity/parse/parseTradeTransaction'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  SAMPLE_SEED_ADDRESS_3,
  SAMPLE_SEED_ADDRESS_4,
  SAMPLE_SEED_ADDRESS_5,
  SAMPLE_SEED_ADDRESS_6,
} from 'uniswap/src/test/fixtures'

/**
 * Testing for REST API transaction parsing utils.
 */

const FROM_ADDRESS = SAMPLE_SEED_ADDRESS_1
const TO_ADDRESS = SAMPLE_SEED_ADDRESS_2
const TEST_HASH = '0x00'
const ERC20_ASSET_ADDRESS = DAI.address
const WRAPPED_NATIVE_ADDRESS = getWrappedNativeAddressWithThrow(UniverseChainId.Mainnet)
const NATIVE_ADDRESS = getNativeAddress(UniverseChainId.Mainnet)

const TRANSACTION_BASE: OnChainTransaction = {
  chainId: UniverseChainId.Mainnet,
  transactionHash: TEST_HASH,
  timestampMillis: BigInt(1000),
  from: FROM_ADDRESS,
  to: TO_ADDRESS,
  label: OnChainTransactionLabel.UNKNOWN,
  status: OnChainTransactionStatus.CONFIRMED,
  transfers: [],
  approvals: [],
} as unknown as OnChainTransaction

/** Asset change response mocks */

const ERC20_TOKEN_MOCK = {
  address: ERC20_ASSET_ADDRESS,
  symbol: 'asset_symbol',
  decimals: 18,
  type: TokenType.ERC20,
  chainId: UniverseChainId.Mainnet,
  metadata: {
    spamCode: RestSpamCode.NOT_SPAM,
  },
}

const NATIVE_TOKEN_MOCK = {
  address: NATIVE_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  type: TokenType.NATIVE,
  metadata: {
    spamCode: RestSpamCode.NOT_SPAM,
  },
}

const WRAPPED_TOKEN_MOCK = {
  address: WRAPPED_NATIVE_ADDRESS,
  symbol: 'WETH',
  decimals: 18,
  type: TokenType.ERC20,
  metadata: {
    spamCode: RestSpamCode.NOT_SPAM,
  },
}

const VAULT_SHARE_TOKEN_MOCK = {
  address: SAMPLE_SEED_ADDRESS_5,
  symbol: 'vDAI',
  decimals: 18,
  type: TokenType.ERC20,
  chainId: UniverseChainId.Mainnet,
  metadata: {
    spamCode: RestSpamCode.NOT_SPAM,
  },
}

const SPAM_TOKEN_MOCK = {
  address: ERC20_ASSET_ADDRESS,
  symbol: 'SPAM',
  decimals: 18,
  type: TokenType.ERC20,
  metadata: {
    spamCode: RestSpamCode.SPAM,
  },
}

/**
 * Mock for a Fee-on-Transfer (FOT) token.
 * FOT tokens have feeTakenOnTransfer: true in their metadata.
 * Uses a different address than ERC20_TOKEN_MOCK to avoid filterTokenAddress conflicts.
 */
const FOT_TOKEN_ADDRESS = SAMPLE_SEED_ADDRESS_6
const FOT_TOKEN_MOCK = {
  address: FOT_TOKEN_ADDRESS,
  symbol: 'FOT',
  decimals: 18,
  type: TokenType.ERC20,
  chainId: UniverseChainId.Mainnet,
  metadata: {
    spamCode: RestSpamCode.NOT_SPAM,
    feeData: {
      feeDetector: {
        feeTakenOnTransfer: true,
        buyFeeBps: '500', // 5% buy fee
        sellFeeBps: '500', // 5% sell fee
      },
    },
  },
}

const NFT_MOCK = {
  tokenId: 'token_id',
  address: 'nft_contract_address',
  name: 'asset_name',
  collectionName: 'collection_name',
  imageUrl: 'image_url',
  isSpam: false,
  chainId: UniverseChainId.Mainnet,
  type: TokenType.ERC721,
}

/** ERC20 Approve */

const MOCK_ERC20_APPROVE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.APPROVE,
  approvals: [
    {
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
    },
  ],
  protocol: {
    name: 'Uniswap',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

describe(parseApproveTransaction, () => {
  it('ERC20 approve: handle empty approvals', () => {
    expect(parseApproveTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('ERC20 approve: parse valid approval', () => {
    expect(parseApproveTransaction(MOCK_ERC20_APPROVE)).toEqual({
      type: TransactionType.Approve,
      tokenAddress: ERC20_ASSET_ADDRESS,
      spender: TO_ADDRESS,
      approvalAmount: '1',
      dappInfo: {
        name: 'Uniswap',
        icon: 'https://logo.url',
      },
    })
  })
})

/** ERC721 Mint  */

const MOCK_721_MINT: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.MINT,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'nft',
        value: NFT_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1',
      },
      to: TO_ADDRESS,
    },
  ],
  fee: {
    amount: {
      amount: 1,
      raw: '1000000000000000000',
    },
    symbol: 'ETH',
    address: NATIVE_ADDRESS,
  },
} as OnChainTransaction

describe(parseNFTMintTransaction, () => {
  it('NFT Mint: handle empty transfers', () => {
    expect(parseNFTMintTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('NFT Mint: parse 721 mint', () => {
    expect(parseNFTMintTransaction(MOCK_721_MINT)).toEqual({
      type: TransactionType.NFTMint,
      nftSummaryInfo: {
        name: 'asset_name',
        collectionName: 'collection_name',
        imageURL: 'image_url',
        tokenId: 'token_id',
        address: 'nft_contract_address',
      },
      purchaseCurrencyId: `1-nft_contract_address`,
      purchaseCurrencyAmountRaw: '1000000000000000000',
      transactedUSDValue: undefined,
      isSpam: false,
      dappInfo: undefined,
    })
  })
})

/** Receive */

const MOCK_ERC20_RECEIVE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.RECEIVE,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
      from: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

const MOCK_ERC20_RECEIVE_SPAM: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.RECEIVE,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: SPAM_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
      from: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

const MOCK_ERC721_RECEIVE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.RECEIVE,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'nft',
        value: NFT_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1',
      },
      to: TO_ADDRESS,
      from: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

describe(parseReceiveTransaction, () => {
  it('Receive : handle empty transfers', () => {
    expect(parseReceiveTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Receive: parse ERC20 receive', () => {
    expect(parseReceiveTransaction(MOCK_ERC20_RECEIVE)).toEqual({
      type: TransactionType.Receive,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      sender: FROM_ADDRESS,
      transactedUSDValue: undefined,
      isSpam: false,
    })
  })
  it('Receive: parse spam ERC20 receive', () => {
    expect(parseReceiveTransaction(MOCK_ERC20_RECEIVE_SPAM)).toEqual({
      type: TransactionType.Receive,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      sender: FROM_ADDRESS,
      transactedUSDValue: undefined,
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
        address: 'nft_contract_address',
      },
    })
  })
})

/** Send */

const MOCK_ERC20_SEND: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.SEND,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
  ],
} as OnChainTransaction

const MOCK_ERC721_SEND: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.SEND,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'nft',
        value: NFT_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1',
      },
      to: TO_ADDRESS,
    },
  ],
} as OnChainTransaction

describe(parseSendTransaction, () => {
  it('Send : handle empty transfers', () => {
    expect(parseSendTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Send: parse ERC20 send', () => {
    expect(parseSendTransaction(MOCK_ERC20_SEND)).toEqual({
      type: TransactionType.Send,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      recipient: TO_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      transactedUSDValue: undefined,
      isSpam: false,
    })
  })
  it('Send: parse ERC721 send', () => {
    expect(parseSendTransaction(MOCK_ERC721_SEND)).toEqual({
      type: TransactionType.Send,
      assetType: 'erc-721',
      tokenAddress: 'nft_contract_address',
      recipient: TO_ADDRESS,
      currencyAmountRaw: '1',
      transactedUSDValue: undefined,
      isSpam: false,
    })
  })
})

/** Swaps */

const MOCK_ERC20_SWAP: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.SWAP,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: {
          ...ERC20_TOKEN_MOCK,
          address: WRAPPED_NATIVE_ADDRESS,
          symbol: 'WETH',
        },
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

const MOCK_NATIVE_SWAP: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.SWAP,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: NATIVE_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

const MOCK_UNISWAP_X_SWAP: OnChainTransaction = {
  ...MOCK_ERC20_SWAP,
  label: OnChainTransactionLabel.UNISWAP_X,
} as OnChainTransaction

const MOCK_MULTI_TRANSFER_SWAP: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.SWAP,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 10942.066284405611,
        raw: '10942066284405611153912',
      },
      from: SAMPLE_SEED_ADDRESS_3,
      to: FROM_ADDRESS,
    },
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 2125,
        raw: '2125000000000000000000',
      },
      from: FROM_ADDRESS,
      to: SAMPLE_SEED_ADDRESS_4,
    },
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 375,
        raw: '375000000000000000000',
      },
      from: FROM_ADDRESS,
      to: SAMPLE_SEED_ADDRESS_5,
    },
  ],
} as OnChainTransaction

const MOCK_NATIVE_WRAP: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.WRAP,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: NATIVE_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: FROM_ADDRESS,
    },
  ],
} as OnChainTransaction

describe(parseSwapTransaction, () => {
  it('Swap : handle empty transfers', () => {
    expect(parseSwapTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Swap: parse token swap', () => {
    expect(parseSwapTransaction(MOCK_ERC20_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `1-${WRAPPED_NATIVE_ADDRESS}`,
      transactedUSDValue: undefined,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1000000000000000000',
    })
  })
  it('Swap: parse native swap', () => {
    expect(parseSwapTransaction(MOCK_NATIVE_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${NATIVE_ADDRESS}`,
      outputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      transactedUSDValue: undefined,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1000000000000000000',
    })
  })
  it('Swap: parse UniswapX swap', () => {
    expect(parseSwapTransaction(MOCK_UNISWAP_X_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `1-${WRAPPED_NATIVE_ADDRESS}`,
      transactedUSDValue: undefined,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1000000000000000000',
      dappInfo: {
        name: 'Uniswap',
        icon: 'https://protocol-icons.s3.amazonaws.com/icons/uniswap-v4.jpg',
      },
    })
  })
  it('Swap: parse multi-transfer swap with same token', () => {
    expect(parseSwapTransaction(MOCK_MULTI_TRANSFER_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `1-${WRAPPED_NATIVE_ADDRESS}`,
      transactedUSDValue: undefined,
      inputCurrencyAmountRaw: '2500000000000000000000', // 2125000000000000000000 + 375000000000000000000 = 2500000000000000000000 (2500 DAI)
      outputCurrencyAmountRaw: '10942066284405611153912',
    })
  })

  it('Swap: FOT token - filters out fee transfer to non-owner address when feeTakenOnTransfer is true', () => {
    // Simulates a FOT (Fee-on-Transfer) token swap where Zerion returns two RECEIVE transfers:
    // 1. The fee transfer going to a fee recipient (SAMPLE_SEED_ADDRESS_5) - should be filtered out
    // 2. The actual swap amount going to the owner (FROM_ADDRESS) - should be used
    // The parser should only count the transfer TO the owner when the token has feeTakenOnTransfer: true
    const MOCK_FOT_SWAP: OnChainTransaction = {
      ...TRANSACTION_BASE,
      label: OnChainTransactionLabel.SWAP,
      transfers: [
        // User sends a regular token
        {
          direction: Direction.SEND,
          asset: {
            case: 'token',
            value: ERC20_TOKEN_MOCK,
          },
          amount: {
            amount: 1000,
            raw: '1000000000000000000000',
          },
          from: FROM_ADDRESS,
          to: SAMPLE_SEED_ADDRESS_3, // Goes to router/pool
        },
        // FOT fee goes to fee recipient (NOT the owner) - this should be filtered out
        {
          direction: Direction.RECEIVE,
          asset: {
            case: 'token',
            value: FOT_TOKEN_MOCK, // This token has feeTakenOnTransfer: true
          },
          amount: {
            amount: 50, // ~5% fee
            raw: '50000000000000000000',
          },
          from: SAMPLE_SEED_ADDRESS_3,
          to: SAMPLE_SEED_ADDRESS_5, // Fee recipient, NOT the owner
        },
        // Actual swap output goes to the owner - this should be used
        {
          direction: Direction.RECEIVE,
          asset: {
            case: 'token',
            value: FOT_TOKEN_MOCK, // This token has feeTakenOnTransfer: true
          },
          amount: {
            amount: 950, // 95% after fee
            raw: '950000000000000000000',
          },
          from: SAMPLE_SEED_ADDRESS_3,
          to: FROM_ADDRESS, // Owner receives the actual swap output
        },
      ],
    } as OnChainTransaction

    expect(parseSwapTransaction(MOCK_FOT_SWAP)).toEqual({
      type: TransactionType.Swap,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `1-${FOT_TOKEN_ADDRESS}`,
      transactedUSDValue: undefined,
      inputCurrencyAmountRaw: '1000000000000000000000',
      // Should be 950 (the amount to owner), NOT 50 (the fee) or 1000 (total)
      outputCurrencyAmountRaw: '950000000000000000000',
    })
  })
})

describe(parseWrapTransaction, () => {
  it('Wrap: parse wrap', () => {
    expect(parseWrapTransaction(MOCK_NATIVE_WRAP)).toEqual({
      type: TransactionType.Wrap,
      unwrapped: false,
      currencyAmountRaw: '1000000000000000000',
    })
  })
  it('Wrap: parse unwrap', () => {
    const MOCK_NATIVE_UNWRAP: OnChainTransaction = {
      ...TRANSACTION_BASE,
      label: OnChainTransactionLabel.UNWRAP,
      transfers: MOCK_NATIVE_WRAP.transfers,
    } as OnChainTransaction
    expect(parseWrapTransaction(MOCK_NATIVE_UNWRAP)).toEqual({
      type: TransactionType.Wrap,
      unwrapped: true,
      currencyAmountRaw: '1000000000000000000',
    })
  })
})

/** Deposit Transactions */

const MOCK_ERC20_DEPOSIT: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.VAULT_DEPOSIT,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: VAULT_SHARE_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      from: ZERO_ADDRESS,
      to: FROM_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap Earn',
    logoUrl: 'https://earn.logo',
  },
} as OnChainTransaction

describe(parseDepositTransaction, () => {
  it('Deposit: handle empty transfers', () => {
    expect(parseDepositTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Deposit: parse ERC20 deposit', () => {
    expect(parseDepositTransaction(MOCK_ERC20_DEPOSIT)).toEqual({
      type: TransactionType.Deposit,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      dappInfo: {
        name: 'Uniswap Earn',
        icon: 'https://earn.logo',
      },
    })
  })
})

/** Withdraw Transactions */

const MOCK_ERC20_WITHDRAW: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.WITHDRAW,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: FROM_ADDRESS,
      from: TO_ADDRESS,
    },
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Superfluid',
    logoUrl: 'https://superfluid.logo',
  },
} as OnChainTransaction

describe(parseWithdrawTransaction, () => {
  it('Withdraw: handle empty transfers', () => {
    expect(parseWithdrawTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Withdraw: parse ERC20 withdraw', () => {
    expect(parseWithdrawTransaction(MOCK_ERC20_WITHDRAW)).toEqual({
      type: TransactionType.Withdraw,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      currencyAmountRaw: '1000000000000000000',
      dappInfo: {
        name: 'Superfluid',
        icon: 'https://superfluid.logo',
      },
    })
  })
  it('Withdraw: does not produce TransactionType.Wrap', () => {
    const result = parseWithdrawTransaction(MOCK_ERC20_WITHDRAW)
    expect(result?.type).not.toEqual(TransactionType.Wrap)
  })
  it('Withdraw: picks RECEIVE transfer even when SEND comes first', () => {
    const reorderedWithdraw: OnChainTransaction = {
      ...TRANSACTION_BASE,
      label: OnChainTransactionLabel.WITHDRAW,
      transfers: [
        {
          direction: Direction.SEND,
          asset: { case: 'token', value: WRAPPED_TOKEN_MOCK },
          amount: { amount: 1, raw: '1000000000000000000' },
          from: FROM_ADDRESS,
          to: TO_ADDRESS,
        },
        {
          direction: Direction.RECEIVE,
          asset: { case: 'token', value: ERC20_TOKEN_MOCK },
          amount: { amount: 1, raw: '2000000000000000000' },
          to: FROM_ADDRESS,
          from: TO_ADDRESS,
        },
      ],
    } as OnChainTransaction
    const result = parseWithdrawTransaction(reorderedWithdraw)
    expect(result).toEqual({
      type: TransactionType.Withdraw,
      assetType: 'currency',
      tokenAddress: ERC20_ASSET_ADDRESS,
      currencyAmountRaw: '2000000000000000000',
      dappInfo: undefined,
    })
  })
})

/** Bridge Transactions */

const ARBITRUM_CHAIN_ID = 42161

const ARBITRUM_TOKEN_MOCK = {
  address: ERC20_ASSET_ADDRESS,
  symbol: 'DAI',
  decimals: 18,
  type: TokenType.ERC20,
  chainId: ARBITRUM_CHAIN_ID,
}

const MOCK_BRIDGE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.BRIDGE,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ARBITRUM_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '950000000000000000',
      },
      from: FROM_ADDRESS,
    },
  ],
} as unknown as OnChainTransaction

// Import the parseRestBridgeTransaction function
import { parseBridgeTransaction } from 'uniswap/src/features/activity/parse/parseBridgingTransaction'

describe(parseBridgeTransaction, () => {
  it('Bridge: handle empty transfers', () => {
    expect(parseBridgeTransaction(TRANSACTION_BASE)).toBeUndefined()
  })
  it('Bridge: parse cross-chain bridge', () => {
    expect(parseBridgeTransaction(MOCK_BRIDGE)).toEqual({
      type: TransactionType.Bridge,
      inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
      outputCurrencyId: `${ARBITRUM_CHAIN_ID}-${ERC20_ASSET_ADDRESS}`,
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '950000000000000000',
      transactedUSDValue: undefined,
      routingDappInfo: {
        address: '0x0000000000000000000000000000000000000000',
        icon: 'https://protocol-icons.s3.amazonaws.com/icons/across.jpg',
        name: 'Across API',
      },
    })
  })
})

/** On-ramp Transactions */

const MOCK_ONRAMP_PURCHASE = {
  externalSessionId: 'session_123',
  transactionReferenceId: 'ref_456',
  token: {
    address: ERC20_ASSET_ADDRESS,
    symbol: 'DAI',
    chainId: UniverseChainId.Mainnet,
  },
  tokenAmount: {
    amount: 100,
  },
  fiatCurrency: 'USD',
  fiatAmount: 100,
  serviceProvider: {
    serviceProvider: 'COINBASEPAY',
    name: 'Coinbase',
    url: 'https://www.coinbase.com/',
    logoLightUrl: 'https://logo.io/COINBASEPAY/short_logo_light.png',
    logoDarkUrl: 'https://logo.io/COINBASEPAY/short_logo_dark.png',
    supportUrl: 'https://help.coinbase.com/',
  },
  totalFee: 5,
} as unknown as FiatOnRampTransaction

const MOCK_ONRAMP_TRANSFER = {
  externalSessionId: 'session_789',
  transactionReferenceId: 'ref_101',
  token: {
    address: ERC20_ASSET_ADDRESS,
    symbol: 'DAI',
    chainId: UniverseChainId.Mainnet,
  },
  tokenAmount: {
    amount: 50,
  },
  fiatCurrency: 'DAI', // Same as token symbol = transfer
  fiatAmount: 50,
  serviceProvider: {
    serviceProvider: 'MOONPAY',
    name: 'MoonPay',
    url: 'https://www.moonpay.com/',
    logoLightUrl: 'https://logo.io/MOONPAY/logo_light.png',
    logoDarkUrl: 'https://logo.io/MOONPAY/logo_dark.png',
    supportUrl: 'https://support.moonpay.com/',
  },
  totalFee: 2,
} as unknown as FiatOnRampTransaction

// Import the parseRestOnRampTransaction function
import { parseOnRampTransaction } from 'uniswap/src/features/activity/parse/parseOnRampTransaction'

describe(parseOnRampTransaction, () => {
  it('OnRamp: handle empty transaction', () => {
    expect(parseOnRampTransaction({} as FiatOnRampTransaction)).toBeUndefined()
  })
  it('OnRamp: parse fiat purchase', () => {
    expect(parseOnRampTransaction(MOCK_ONRAMP_PURCHASE)).toEqual({
      type: TransactionType.OnRampPurchase,
      id: 'session_123',
      sourceAmount: 100,
      sourceCurrency: 'USD',
      destinationTokenAddress: ERC20_ASSET_ADDRESS,
      destinationTokenAmount: 100,
      destinationTokenSymbol: 'DAI',
      serviceProvider: {
        id: 'COINBASEPAY',
        name: 'Coinbase',
        url: 'https://www.coinbase.com/',
        logoLightUrl: 'https://logo.io/COINBASEPAY/short_logo_light.png',
        logoDarkUrl: 'https://logo.io/COINBASEPAY/short_logo_dark.png',
        supportUrl: 'https://help.coinbase.com/',
      },
      totalFee: 5,
      providerTransactionId: 'ref_456',
    })
  })
  it('OnRamp: parse crypto transfer', () => {
    expect(parseOnRampTransaction(MOCK_ONRAMP_TRANSFER)).toEqual({
      type: TransactionType.OnRampTransfer,
      id: 'session_789',
      sourceAmount: 50,
      sourceCurrency: 'DAI',
      destinationTokenAddress: ERC20_ASSET_ADDRESS,
      destinationTokenAmount: 50,
      destinationTokenSymbol: 'DAI',
      serviceProvider: {
        id: 'MOONPAY',
        name: 'MoonPay',
        url: 'https://www.moonpay.com/',
        logoLightUrl: 'https://logo.io/MOONPAY/logo_light.png',
        logoDarkUrl: 'https://logo.io/MOONPAY/logo_dark.png',
        supportUrl: 'https://support.moonpay.com/',
      },
      totalFee: 2,
      providerTransactionId: 'ref_101',
    })
  })
})

/** NFT Purchase and Sell */

// For now, REST parsers don't handle NFT trades

/** Liquidity Transactions */

const MOCK_LIQUIDITY_INCREASE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.INCREASE_LIQUIDITY,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '500000000000000000',
      },
      to: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap V3',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

const MOCK_LIQUIDITY_DECREASE: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.DECREASE_LIQUIDITY,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '800000000000000000',
      },
      from: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '400000000000000000',
      },
      from: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap V3',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

const MOCK_CREATE_POOL: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.CREATE_POOL,
  transfers: [
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '2000000000000000000',
      },
      to: TO_ADDRESS,
    },
    {
      direction: Direction.SEND,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '1000000000000000000',
      },
      to: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap V3',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

const MOCK_COLLECT_FEES: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.CLAIM,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '100000000000000000',
      },
      from: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

const MOCK_COLLECT_FEES_TWO_TOKENS: OnChainTransaction = {
  ...TRANSACTION_BASE,
  label: OnChainTransactionLabel.CLAIM,
  transfers: [
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: ERC20_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '200000000000000000',
      },
      from: TO_ADDRESS,
    },
    {
      direction: Direction.RECEIVE,
      asset: {
        case: 'token',
        value: WRAPPED_TOKEN_MOCK,
      },
      amount: {
        amount: 1,
        raw: '150000000000000000',
      },
      from: TO_ADDRESS,
    },
  ],
  protocol: {
    name: 'Uniswap V3',
    logoUrl: 'https://logo.url',
  },
} as OnChainTransaction

describe(parseLiquidityTransaction, () => {
  it('Liquidity: handle empty transfers', () => {
    const result = parseLiquidityTransaction(TRANSACTION_BASE)
    expect(result.type).toEqual(TransactionType.Unknown)
  })

  it('Liquidity: parse liquidity increase', () => {
    expect(parseLiquidityTransaction(MOCK_LIQUIDITY_INCREASE)).toEqual({
      type: TransactionType.LiquidityIncrease,
      currency0Id: `1-${ERC20_ASSET_ADDRESS}`,
      currency1Id: `1-${WRAPPED_NATIVE_ADDRESS}`,
      currency0AmountRaw: '1000000000000000000',
      currency1AmountRaw: '500000000000000000',
      isSpam: false,
      dappInfo: {
        name: 'Uniswap V3',
        icon: 'https://logo.url',
      },
    })
  })

  it('Liquidity: parse liquidity decrease', () => {
    expect(parseLiquidityTransaction(MOCK_LIQUIDITY_DECREASE)).toEqual({
      type: TransactionType.LiquidityDecrease,
      currency0Id: `1-${ERC20_ASSET_ADDRESS}`,
      currency1Id: `1-${WRAPPED_NATIVE_ADDRESS}`,
      currency0AmountRaw: '800000000000000000',
      currency1AmountRaw: '400000000000000000',
      isSpam: false,
      dappInfo: {
        name: 'Uniswap V3',
        icon: 'https://logo.url',
      },
    })
  })

  it('Liquidity: parse create pool', () => {
    expect(parseLiquidityTransaction(MOCK_CREATE_POOL)).toEqual({
      type: TransactionType.CreatePool,
      currency0Id: `1-${ERC20_ASSET_ADDRESS}`,
      currency1Id: `1-${WRAPPED_NATIVE_ADDRESS}`,
      currency0AmountRaw: '2000000000000000000',
      currency1AmountRaw: '1000000000000000000',
      isSpam: false,
      dappInfo: {
        name: 'Uniswap V3',
        icon: 'https://logo.url',
      },
    })
  })

  it('Liquidity: parse collect fees with single token', () => {
    expect(parseLiquidityTransaction(MOCK_COLLECT_FEES)).toEqual({
      type: TransactionType.CollectFees,
      currency0Id: `1-${ERC20_ASSET_ADDRESS}`,
      currency1Id: undefined,
      currency0AmountRaw: '100000000000000000',
      currency1AmountRaw: undefined,
      isSpam: false,
      dappInfo: {
        name: 'Uniswap',
        icon: 'https://logo.url',
      },
    })
  })

  it('Liquidity: parse collect fees with two tokens', () => {
    expect(parseLiquidityTransaction(MOCK_COLLECT_FEES_TWO_TOKENS)).toEqual({
      type: TransactionType.CollectFees,
      currency0Id: `1-${ERC20_ASSET_ADDRESS}`,
      currency1Id: `1-${WRAPPED_NATIVE_ADDRESS}`,
      currency0AmountRaw: '200000000000000000',
      currency1AmountRaw: '150000000000000000',
      isSpam: false,
      dappInfo: {
        name: 'Uniswap V3',
        icon: 'https://logo.url',
      },
    })
  })
})

/**
 * Parent extraction util
 */

describe(extractRestOnChainTransactionDetails, () => {
  it('Empty transaction', () => {
    const result = extractRestOnChainTransactionDetails(TRANSACTION_BASE)
    expect(result).toHaveLength(1)
    expect(result[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
  })
  it('Approve', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_APPROVE)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
  })
  it('Send', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_SEND)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Send)
  })
  it('Receive', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_RECEIVE)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Receive)
  })
  it('Vault Transfer Out', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_SEND,
      label: OnChainTransactionLabel.VAULT_TRANSFER_OUT,
    } as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Send)
  })
  it('Vault Transfer In', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_RECEIVE,
      label: OnChainTransactionLabel.VAULT_TRANSFER_IN,
    } as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Receive)
  })
  it('generic Deposit label remains unknown until backend semantics are confirmed', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_DEPOSIT,
      label: OnChainTransactionLabel.DEPOSIT,
    } as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
  })
  it('Vault Deposit', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_DEPOSIT)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo).toMatchObject({
      type: TransactionType.Deposit,
      isVault: true,
      vaultAddress: SAMPLE_SEED_ADDRESS_5,
    })
  })
  it('Lend label preserves the existing wrap parser behavior', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_DEPOSIT,
      label: OnChainTransactionLabel.LEND,
    } as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Wrap)
  })
  it('Stake and Unstake labels are not remapped to vault activity', () => {
    const stakeTxns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_DEPOSIT,
      label: OnChainTransactionLabel.STAKE,
    } as OnChainTransaction)
    const unstakeTxns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_WITHDRAW,
      label: OnChainTransactionLabel.UNSTAKE,
    } as OnChainTransaction)

    expect(stakeTxns).toHaveLength(1)
    expect(stakeTxns[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
    expect(unstakeTxns).toHaveLength(1)
    expect(unstakeTxns[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
  })
  it('Swap token', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_SWAP)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Swap)
    expect(txns[0]?.routing).toEqual(TradingApi.Routing.CLASSIC)
  })
  it('UniswapX swap', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_UNISWAP_X_SWAP)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Swap)
    expect(txns[0]?.routing).toEqual(TradingApi.Routing.DUTCH_V2)
  })
  it('Wrap', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_NATIVE_WRAP)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Wrap)
  })
  it('Mint', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_721_MINT)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.NFTMint)
  })
  it('Liquidity Increase', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_LIQUIDITY_INCREASE)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.LiquidityIncrease)
  })
  it('Liquidity Decrease', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_LIQUIDITY_DECREASE)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.LiquidityDecrease)
  })
  it('Create Pool', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_CREATE_POOL)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.CreatePool)
  })
  it('Claim', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_COLLECT_FEES)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.CollectFees)
  })
  it('Bridge', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_BRIDGE)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Bridge)
  })
  it('Withdraw', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_WITHDRAW)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Withdraw)
    expect(txns[0]?.typeInfo).not.toHaveProperty('isVault')
  })
  it('Vault Withdraw', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...MOCK_ERC20_WITHDRAW,
      label: OnChainTransactionLabel.VAULT_WITHDRAW,
      transfers: [
        {
          direction: Direction.RECEIVE,
          asset: { case: 'token', value: ERC20_TOKEN_MOCK },
          amount: { amount: 1, raw: '1000000000000000000' },
          to: FROM_ADDRESS,
          from: TO_ADDRESS,
        },
        {
          direction: Direction.SEND,
          asset: { case: 'token', value: VAULT_SHARE_TOKEN_MOCK },
          amount: { amount: 1, raw: '1000000000000000000' },
          from: FROM_ADDRESS,
          to: ZERO_ADDRESS,
        },
      ],
    } as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo).toMatchObject({
      type: TransactionType.Withdraw,
      isVault: true,
      vaultAddress: SAMPLE_SEED_ADDRESS_5,
    })
  })
  it('Withdraw does not produce Wrap type', () => {
    const txns = extractRestOnChainTransactionDetails(MOCK_ERC20_WITHDRAW)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).not.toEqual(TransactionType.Wrap)
  })
  it('Unknown', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...TRANSACTION_BASE,
      label: OnChainTransactionLabel.UNKNOWN,
    } as unknown as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
  })

  describe('EXECUTE label (batched transactions)', () => {
    const MOCK_EXECUTE_SWAP_AND_APPROVE: OnChainTransaction = {
      ...TRANSACTION_BASE,
      label: OnChainTransactionLabel.EXECUTE,
      transfers: [
        {
          direction: Direction.RECEIVE,
          asset: {
            case: 'token',
            value: {
              ...ERC20_TOKEN_MOCK,
              address: WRAPPED_NATIVE_ADDRESS,
              symbol: 'WETH',
            },
          },
          amount: { amount: 1, raw: '1000000000000000000' },
          from: SAMPLE_SEED_ADDRESS_3,
          to: FROM_ADDRESS,
        },
        {
          direction: Direction.SEND,
          asset: { case: 'token', value: ERC20_TOKEN_MOCK },
          amount: { amount: 1, raw: '1000000000000000000' },
          from: FROM_ADDRESS,
          to: SAMPLE_SEED_ADDRESS_3,
        },
      ],
      approvals: [
        {
          asset: { case: 'token', value: ERC20_TOKEN_MOCK },
          amount: { amount: 1, raw: '1000000000000000000' },
        },
      ],
      protocol: { name: 'Permit2', logoUrl: 'https://permit2.logo' },
    } as OnChainTransaction

    it('EXECUTE with swap + approval returns single swap entry, approval is dropped', () => {
      const txns = extractRestOnChainTransactionDetails(MOCK_EXECUTE_SWAP_AND_APPROVE)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Swap)
      // Approval intentionally not surfaced for batched swap+approve.
      expect(txns[0]?.typeInfo).not.toHaveProperty('bundledApproval')
    })

    it('EXECUTE with deposit-shaped transfers + approval returns approval instead of inferring vault deposit', () => {
      const depositAndApproval: OnChainTransaction = {
        ...MOCK_ERC20_DEPOSIT,
        label: OnChainTransactionLabel.EXECUTE,
        approvals: [
          {
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
          },
        ],
      } as OnChainTransaction

      const txns = extractRestOnChainTransactionDetails(depositAndApproval)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
    })

    it('EXECUTE zap with vault mint signal preserves swap parsing', () => {
      const zapAndDeposit: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
        transfers: [
          {
            direction: Direction.SEND,
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: FROM_ADDRESS,
            to: SAMPLE_SEED_ADDRESS_3,
          },
          {
            direction: Direction.RECEIVE,
            asset: {
              case: 'token',
              value: {
                ...WRAPPED_TOKEN_MOCK,
                address: WRAPPED_NATIVE_ADDRESS,
                symbol: 'WETH',
              },
            },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: SAMPLE_SEED_ADDRESS_3,
            to: FROM_ADDRESS,
          },
          {
            direction: Direction.SEND,
            asset: {
              case: 'token',
              value: {
                ...WRAPPED_TOKEN_MOCK,
                address: WRAPPED_NATIVE_ADDRESS,
                symbol: 'WETH',
              },
            },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: FROM_ADDRESS,
            to: TO_ADDRESS,
          },
          {
            direction: Direction.RECEIVE,
            asset: { case: 'token', value: VAULT_SHARE_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: ZERO_ADDRESS,
            to: FROM_ADDRESS,
          },
        ],
      } as OnChainTransaction

      const txns = extractRestOnChainTransactionDetails(zapAndDeposit)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo).toMatchObject({
        type: TransactionType.Swap,
        inputCurrencyId: `1-${ERC20_ASSET_ADDRESS}`,
        outputCurrencyId: `1-${WRAPPED_NATIVE_ADDRESS}`,
      })
    })

    it('EXECUTE with withdraw-shaped transfers + approval returns approval instead of inferring vault withdraw', () => {
      const withdrawAndApproval: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
        transfers: [
          {
            direction: Direction.SEND,
            asset: { case: 'token', value: VAULT_SHARE_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: FROM_ADDRESS,
            to: ZERO_ADDRESS,
          },
          {
            direction: Direction.RECEIVE,
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: TO_ADDRESS,
            to: FROM_ADDRESS,
          },
        ],
        approvals: [
          {
            asset: { case: 'token', value: VAULT_SHARE_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
          },
        ],
      } as OnChainTransaction

      const txns = extractRestOnChainTransactionDetails(withdrawAndApproval)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
    })

    it('EXECUTE with non-vault one-sided transfer + approval returns approve instead of deposit', () => {
      const sendAndApproval: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
        transfers: [
          {
            direction: Direction.SEND,
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: FROM_ADDRESS,
            to: TO_ADDRESS,
          },
        ],
        approvals: [
          {
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
          },
        ],
      } as OnChainTransaction

      const txns = extractRestOnChainTransactionDetails(sendAndApproval)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
    })

    it('EXECUTE with vault mint signal but no sent underlying falls back to approval', () => {
      const mintSignalAndApproval: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
        transfers: [
          {
            direction: Direction.RECEIVE,
            asset: { case: 'token', value: VAULT_SHARE_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
            from: ZERO_ADDRESS,
            to: FROM_ADDRESS,
          },
        ],
        approvals: [
          {
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
          },
        ],
      } as OnChainTransaction

      const txns = extractRestOnChainTransactionDetails(mintSignalAndApproval)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
    })

    it('EXECUTE with only approval (no transfers) returns single approve entry', () => {
      const approvalOnly: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
        transfers: [],
        approvals: [
          {
            asset: { case: 'token', value: ERC20_TOKEN_MOCK },
            amount: { amount: 1, raw: '1000000000000000000' },
          },
        ],
        protocol: { name: 'Permit2', logoUrl: 'https://permit2.logo' },
      } as unknown as OnChainTransaction
      const txns = extractRestOnChainTransactionDetails(approvalOnly)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Approve)
    })

    it('EXECUTE with only swap (no approvals) returns single swap entry', () => {
      const swapOnly: OnChainTransaction = {
        ...MOCK_EXECUTE_SWAP_AND_APPROVE,
        approvals: [],
      } as unknown as OnChainTransaction
      const txns = extractRestOnChainTransactionDetails(swapOnly)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Swap)
    })

    it('EXECUTE with neither transfers nor approvals falls through to unknown', () => {
      const empty: OnChainTransaction = {
        ...TRANSACTION_BASE,
        label: OnChainTransactionLabel.EXECUTE,
      } as OnChainTransaction
      const txns = extractRestOnChainTransactionDetails(empty)
      expect(txns).toHaveLength(1)
      expect(txns[0]?.typeInfo.type).toEqual(TransactionType.Unknown)
    })
  })

  it('maps sponsorship metadata to sponsorInfo, preferring it over the paymaster address', () => {
    const txns = extractRestOnChainTransactionDetails({
      ...TRANSACTION_BASE,
      paymaster: { address: SAMPLE_SEED_ADDRESS_1 },
      sponsorship: { name: 'Uniswap', logoUrl: 'https://app.uniswap.org/favicon.png' },
    } as unknown as OnChainTransaction)
    expect(txns).toHaveLength(1)
    expect(txns[0]?.sponsorInfo).toEqual({ name: 'Uniswap', icon: 'https://app.uniswap.org/favicon.png' })
    expect(txns[0]?.paymaster).toEqual(SAMPLE_SEED_ADDRESS_1)
  })
})
