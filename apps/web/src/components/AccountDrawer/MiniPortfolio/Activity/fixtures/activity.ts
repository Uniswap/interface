import { ChainId, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, WETH9 } from '@uniswap/sdk-core'
import { DAI } from 'constants/tokens'
import {
  AssetActivityPartsFragment,
  Chain,
  Currency,
  NftApprovalPartsFragment,
  NftApproveForAllPartsFragment,
  NftStandard,
  NftTransferPartsFragment,
  SwapOrderStatus,
  TokenApprovalPartsFragment,
  TokenStandard,
  TokenTransferPartsFragment,
  TransactionDetailsPartsFragment,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from 'graphql/data/__generated__/types-and-hooks'

import { MOONPAY_SENDER_ADDRESSES } from '../../constants'

const MockOrderTimestamp = 10000
const MockRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
export const MockSenderAddress = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'

export const mockTransactionDetailsPartsFragment: TransactionDetailsPartsFragment = {
  __typename: 'TransactionDetails',
  id: 'tx123',
  type: TransactionType.Swap,
  from: '0xSenderAddress',
  to: '0xRecipientAddress',
  hash: '0xHashValue',
  nonce: 123,
  status: TransactionStatus.Confirmed,
  assetChanges: [],
}

const mockAssetActivityPartsFragment = {
  __typename: 'AssetActivity',
  id: 'activityId',
  timestamp: MockOrderTimestamp,
  chain: Chain.Ethereum,
  details: {
    __typename: 'SwapOrderDetails',
    id: 'detailsId',
    offerer: 'offererId',
    hash: 'someHash',
    inputTokenQuantity: '100',
    outputTokenQuantity: '200',
    orderStatus: SwapOrderStatus.Open,
    inputToken: {
      __typename: 'Token',
      id: 'tokenId',
      chain: Chain.Ethereum,
      standard: TokenStandard.Erc20,
    },
    outputToken: {
      __typename: 'Token',
      id: 'tokenId',
      chain: Chain.Ethereum,
      standard: TokenStandard.Erc20,
    },
  },
}

const mockSwapOrderDetailsPartsFragment = {
  __typename: 'SwapOrderDetails',
  id: 'someId',
  offerer: 'someOfferer',
  hash: 'someHash',
  inputTokenQuantity: '100',
  outputTokenQuantity: '200',
  orderStatus: SwapOrderStatus.Open,
  inputToken: {
    __typename: 'Token',
    id: DAI.address,
    name: 'DAI',
    symbol: DAI.symbol,
    address: DAI.address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'imageId',
        url: 'someUrl',
      },
    },
  },
  outputToken: {
    __typename: 'Token',
    id: WETH9[1].address,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: WETH9[1].address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'imageId',
        url: 'someUrl',
      },
    },
  },
}

const mockNftApprovalPartsFragment: NftApprovalPartsFragment = {
  __typename: 'NftApproval',
  id: 'approvalId',
  nftStandard: NftStandard.Erc721, // Replace with actual enum value
  approvedAddress: '0xApprovedAddress',
  asset: {
    __typename: 'NftAsset',
    id: 'assetId',
    name: 'SomeNftName',
    tokenId: 'tokenId123',
    nftContract: {
      __typename: 'NftContract',
      id: 'nftContractId',
      chain: Chain.Ethereum, // Replace with actual enum value
      address: '0xContractAddress',
    },
    image: {
      __typename: 'Image',
      id: 'imageId',
      url: 'imageUrl',
    },
    collection: {
      __typename: 'NftCollection',
      id: 'collectionId',
      name: 'SomeCollectionName',
    },
  },
}

const mockNftApproveForAllPartsFragment: NftApproveForAllPartsFragment = {
  __typename: 'NftApproveForAll',
  id: 'approveForAllId',
  nftStandard: NftStandard.Erc721, // Replace with actual enum value
  operatorAddress: '0xOperatorAddress',
  approved: true,
  asset: {
    __typename: 'NftAsset',
    id: 'assetId',
    name: 'SomeNftName',
    tokenId: 'tokenId123',
    nftContract: {
      __typename: 'NftContract',
      id: 'nftContractId',
      chain: Chain.Ethereum, // Replace with actual enum value
      address: '0xContractAddress',
    },
    image: {
      __typename: 'Image',
      id: 'imageId',
      url: 'imageUrl',
    },
    collection: {
      __typename: 'NftCollection',
      id: 'collectionId',
      name: 'SomeCollectionName',
    },
  },
}

const mockNftTransferPartsFragment: NftTransferPartsFragment = {
  __typename: 'NftTransfer',
  id: 'transferId',
  nftStandard: NftStandard.Erc721,
  sender: MockSenderAddress,
  recipient: MockRecipientAddress,
  direction: TransactionDirection.Out,
  asset: {
    __typename: 'NftAsset',
    id: 'assetId',
    name: 'SomeNftName',
    tokenId: 'tokenId123',
    nftContract: {
      __typename: 'NftContract',
      id: 'nftContractId',
      chain: Chain.Ethereum,
      address: '0xContractAddress',
    },
    image: {
      __typename: 'Image',
      id: 'imageId',
      url: 'imageUrl',
    },
    collection: {
      __typename: 'NftCollection',
      id: 'collectionId',
      name: 'SomeCollectionName',
    },
  },
}

const mockSpamNftTransferPartsFragment: NftTransferPartsFragment = {
  ...mockNftTransferPartsFragment,
  asset: {
    ...mockNftTransferPartsFragment.asset,
    isSpam: true,
  },
}

export const mockTokenTransferOutPartsFragment: TokenTransferPartsFragment = {
  __typename: 'TokenTransfer',
  id: 'tokenTransferId',
  tokenStandard: TokenStandard.Erc20,
  quantity: '100',
  sender: MockSenderAddress,
  recipient: MockRecipientAddress,
  direction: TransactionDirection.Out,
  asset: {
    __typename: 'Token',
    id: DAI.address,
    name: 'DAI',
    symbol: 'DAI',
    address: DAI.address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'logoId',
        url: 'logoUrl',
      },
    },
  },
  transactedValue: {
    __typename: 'Amount',
    id: 'amountId',
    currency: Currency.Usd,
    value: 100,
  },
}

const mockNativeTokenTransferOutPartsFragment: TokenTransferPartsFragment = {
  __typename: 'TokenTransfer',
  id: 'tokenTransferId',
  asset: {
    __typename: 'Token',
    id: 'ETH',
    name: 'Ether',
    symbol: 'ETH',
    address: undefined,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Native,
    project: {
      __typename: 'TokenProject',
      id: 'Ethereum',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'ETH_logo',
        url: 'https://token-icons.s3.amazonaws.com/eth.png',
      },
    },
  },
  tokenStandard: TokenStandard.Native,
  quantity: '0.25',
  sender: MockSenderAddress,
  recipient: MockRecipientAddress,
  direction: TransactionDirection.Out,
  transactedValue: {
    __typename: 'Amount',
    id: 'ETH_amount',
    currency: Currency.Usd,
    value: 399.0225,
  },
}

const mockWrappedEthTransferInPartsFragment: TokenTransferPartsFragment = {
  __typename: 'TokenTransfer',
  id: 'tokenTransferId',
  asset: {
    __typename: 'Token',
    id: 'WETH',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'weth_project_id',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'weth_image',
        url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
  },
  tokenStandard: TokenStandard.Erc20,
  quantity: '0.25',
  sender: MockSenderAddress,
  recipient: MockRecipientAddress,
  direction: TransactionDirection.In,
  transactedValue: {
    __typename: 'Amount',
    id: 'mockWethAmountId',
    currency: Currency.Usd,
    value: 399.1334007875,
  },
}

export const mockTokenTransferInPartsFragment: TokenTransferPartsFragment = {
  __typename: 'TokenTransfer',
  id: 'tokenTransferId',
  tokenStandard: TokenStandard.Erc20,
  quantity: '100',
  sender: MockSenderAddress,
  recipient: MockRecipientAddress,
  direction: TransactionDirection.In,
  asset: {
    __typename: 'Token',
    id: WETH9[1].address,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: WETH9[1].address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'logoId',
        url: 'logoUrl',
      },
    },
  },
  transactedValue: {
    __typename: 'Amount',
    id: 'amountId',
    currency: Currency.Usd,
    value: 100,
  },
}

const mockSpamTokenTransferInPartsFragment: TokenTransferPartsFragment = {
  ...mockTokenTransferInPartsFragment,
  asset: {
    ...mockTokenTransferInPartsFragment.asset,
    project: {
      ...mockTokenTransferInPartsFragment.asset.project,
      id: WETH9[1].address,
      isSpam: true,
    },
  },
}

const mockTokenApprovalPartsFragment: TokenApprovalPartsFragment = {
  __typename: 'TokenApproval',
  id: 'tokenApprovalId',
  tokenStandard: TokenStandard.Erc20,
  approvedAddress: DAI.address,
  quantity: '50',
  asset: {
    __typename: 'Token',
    id: 'tokenId',
    name: 'DAI',
    symbol: 'DAI',
    address: DAI.address,
    decimals: 18,
    chain: Chain.Ethereum,
    standard: TokenStandard.Erc20,
    project: {
      __typename: 'TokenProject',
      id: 'projectId',
      isSpam: false,
      logo: {
        __typename: 'Image',
        id: 'logoId',
        url: 'logoUrl',
      },
    },
  },
}

export const MockOpenUniswapXOrder = {
  ...mockAssetActivityPartsFragment,
  details: mockSwapOrderDetailsPartsFragment,
} as AssetActivityPartsFragment

export const MockClosedUniswapXOrder = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...mockSwapOrderDetailsPartsFragment,
    orderStatus: SwapOrderStatus.Expired,
  },
} as AssetActivityPartsFragment

const commonTransactionDetailsFields = {
  __typename: 'TransactionDetails',
  from: MockSenderAddress,
  hash: 'someHash',
  id: 'transactionId',
  nonce: 12345,
  status: TransactionStatus.Confirmed,
  to: MockRecipientAddress,
}

export const MockNFTApproval = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Approve,
    assetChanges: [mockNftApprovalPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockNFTApprovalForAll = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Approve,
    assetChanges: [mockNftApproveForAllPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockMint = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Mint,
    assetChanges: [mockNftTransferPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockSpamMint = {
  ...MockMint,
  details: {
    ...MockMint.details,
    assetChanges: [mockSpamNftTransferPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockSwap = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Swap,
    assetChanges: [mockTokenTransferOutPartsFragment, mockTokenTransferInPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockSpamSwap = {
  ...MockSwap,
  details: {
    ...MockSwap.details,
    assetChanges: [mockTokenTransferOutPartsFragment, mockSpamTokenTransferInPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockSwapOrder = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.SwapOrder,
    assetChanges: [mockTokenTransferOutPartsFragment, mockTokenTransferInPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockTokenApproval = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Approve,
    assetChanges: [mockTokenApprovalPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockTokenSend = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Send,
    assetChanges: [mockTokenTransferOutPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockTokenReceive = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Receive,
    assetChanges: [mockTokenTransferInPartsFragment],
  },
} as AssetActivityPartsFragment

export const MockRemoveLiquidity = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[ChainId.MAINNET],
    type: TransactionType.Receive,
    assetChanges: [
      mockTokenTransferInPartsFragment,
      {
        ...mockTokenTransferOutPartsFragment,
        direction: TransactionDirection.In,
      },
    ],
  },
} as AssetActivityPartsFragment

export const MockMoonpayPurchase = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Receive,
    assetChanges: [
      {
        ...mockTokenTransferInPartsFragment,
        sender: MOONPAY_SENDER_ADDRESSES[0],
      },
    ],
  },
} as AssetActivityPartsFragment

export const MockNFTReceive = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Receive,
    assetChanges: [
      {
        ...mockNftTransferPartsFragment,
        direction: TransactionDirection.In,
      },
    ],
  },
} as AssetActivityPartsFragment

export const MockNFTPurchase = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Swap,
    assetChanges: [
      mockTokenTransferOutPartsFragment,
      {
        ...mockNftTransferPartsFragment,
        direction: TransactionDirection.In,
      },
    ],
  },
} as AssetActivityPartsFragment

export const MockWrap = {
  ...mockAssetActivityPartsFragment,
  details: {
    ...commonTransactionDetailsFields,
    type: TransactionType.Lend,
    assetChanges: [mockNativeTokenTransferOutPartsFragment, mockWrappedEthTransferInPartsFragment],
  },
} as AssetActivityPartsFragment
