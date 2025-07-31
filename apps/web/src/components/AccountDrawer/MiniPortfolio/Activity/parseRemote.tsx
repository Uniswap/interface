/* eslint-disable max-params */
import { BigNumber } from '@ethersproject/bignumber'
import type { Currency } from '@uniswap/sdk-core'
import {
  CHAIN_TO_ADDRESSES_MAP,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TradeType,
  UNI_ADDRESSES,
} from '@uniswap/sdk-core'
import { gqlToCurrency, supportedChainIdFromGQLChain } from 'appGraphql/data/util'
import UniswapXBolt from 'assets/svg/bolt.svg'
import moonpayLogoSrc from 'assets/svg/moonpay.svg'
import type { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { convertGQLTransactionStatus } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import {
  MOONPAY_SENDER_ADDRESSES,
  getLimitOrderTextTable,
  getOrderTextTable,
} from 'components/AccountDrawer/MiniPortfolio/constants'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { parseRemote as parseRemoteSignature } from 'state/signatures/parseRemote'
import type { OrderActivity, UniswapXOrderDetails } from 'state/signatures/types'
import { SignatureType } from 'state/signatures/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { Flex, Text, styled } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type {
  AssetActivityPartsFragment,
  NftApprovalPartsFragment,
  NftApproveForAllPartsFragment,
  NftTransferPartsFragment,
  OffRampTransactionDetailsPartsFragment,
  OnRampTransactionDetailsPartsFragment,
  OnRampTransferPartsFragment,
  TokenApprovalPartsFragment,
  TokenAssetPartsFragment,
  TokenTransferPartsFragment,
  TransactionDetailsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  Currency as GQLCurrency,
  TransactionDirection,
  TransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { TransactionType as UniswapTransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isAddress, isSameAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

type TransactionChanges = {
  NftTransfer: NftTransferPartsFragment[]
  TokenTransfer: TokenTransferPartsFragment[]
  TokenApproval: TokenApprovalPartsFragment[]
  NftApproval: NftApprovalPartsFragment[]
  NftApproveForAll: NftApproveForAllPartsFragment[]
}

type FormatNumberOrStringFunctionType = ReturnType<typeof useLocalizationContext>['formatNumberOrString']

// TODO: Move common contract metadata to a backend service
const UNI_IMG =
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'

const ENS_IMG =
  'https://464911102-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/collections%2F2TjMAeHSzwlQgcOdL48E%2Ficon%2FKWP0gk2C6bdRPliWIA6o%2Fens%20transparent%20background.png?alt=media&token=bd28b063-5a75-4971-890c-97becea09076'

const COMMON_CONTRACTS: { [key: string]: Partial<Activity> | undefined } = {
  [UNI_ADDRESSES[UniverseChainId.Mainnet].toLowerCase()]: {
    title: i18n.t('common.uniGovernance'),
    descriptor: i18n.t('common.contractInteraction'),
    logos: [UNI_IMG],
  },
  // TODO(cartcrom): Add permit2-specific logo
  '0x000000000022d473030f116ddee9f6b43ac78ba3': {
    title: i18n.t('common.permit2'),
    descriptor: i18n.t('common.uniswapProtocol'),
    logos: [UNI_IMG],
  },
  '0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41': {
    title: i18n.t('common.ethereumNameService'),
    descriptor: i18n.t('common.publicResolver'),
    logos: [ENS_IMG],
  },
  '0x58774bb8acd458a640af0b88238369a167546ef2': {
    title: i18n.t('common.ethereumNameService'),
    descriptor: i18n.t('common.dnsRegistrar'),
    logos: [ENS_IMG],
  },
  '0x084b1c3c81545d370f3634392de611caabff8148': {
    title: i18n.t('common.ethereumNameService'),
    descriptor: i18n.t('common.reverseRegistrar'),
    logos: [ENS_IMG],
  },
  '0x283af0b28c62c092c9727f1ee09c02ca627eb7f5': {
    title: i18n.t('common.ethereumNameService'),
    descriptor: i18n.t('common.ethRegistrarController'),
    logos: [ENS_IMG],
  },
}

const SPAMMABLE_ACTIVITY_TYPES = [TransactionType.Receive, TransactionType.Mint, TransactionType.Unknown]
function isSpam(
  { NftTransfer, TokenTransfer }: TransactionChanges,
  details: TransactionDetailsPartsFragment,
  account: string,
): boolean {
  if (!SPAMMABLE_ACTIVITY_TYPES.includes(details.type) || details.from === account) {
    return false
  }
  return NftTransfer.some((nft) => nft.asset.isSpam) || TokenTransfer.some((t) => t.asset.project?.isSpam)
}

function callsV3PositionManagerContract(assetActivity: TransactionActivity) {
  const supportedChain = supportedChainIdFromGQLChain(assetActivity.chain)
  if (!supportedChain) {
    return false
  }
  return isSameAddress(assetActivity.details.to, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[supportedChain])
}

function callsV4PositionManagerContract(assetActivity: TransactionActivity) {
  const supportedChain = supportedChainIdFromGQLChain(assetActivity.chain)
  if (!supportedChain) {
    return false
  }

  // monad testnet does not have v4 support
  if (supportedChain === UniverseChainId.MonadTestnet) {
    return false
  }

  return (
    isEVMChain(supportedChain) &&
    isSameAddress(assetActivity.details.to, CHAIN_TO_ADDRESSES_MAP[supportedChain].v4PositionManagerAddress)
  )
}
function callsPositionManagerContract(assetActivity: TransactionActivity) {
  return callsV3PositionManagerContract(assetActivity) || callsV4PositionManagerContract(assetActivity)
}

// Gets counts for number of NFTs in each collection present
function getCollectionCounts(nftTransfers: NftTransferPartsFragment[]): { [key: string]: number | undefined } {
  return nftTransfers.reduce(
    (acc, NFTChange) => {
      const key = NFTChange.asset.collection?.name ?? NFTChange.asset.name
      if (key) {
        acc[key] = (acc[key] ?? 0) + 1
      }
      return acc
    },
    {} as { [key: string]: number | undefined },
  )
}

function getSwapTitle(sent: TokenTransferPartsFragment, received: TokenTransferPartsFragment): string | undefined {
  const supportedSentChain = supportedChainIdFromGQLChain(sent.asset.chain)
  const supportedReceivedChain = supportedChainIdFromGQLChain(received.asset.chain)
  if (!supportedSentChain || !supportedReceivedChain) {
    logger.error(new Error('Invalid activity from unsupported chain received from GQL'), {
      tags: {
        file: 'parseRemote',
        function: 'getSwapTitle',
      },
      extra: { sentAsset: sent.asset, receivedAsset: received.asset },
    })
    return undefined
  }
  if (
    sent.tokenStandard === NATIVE_CHAIN_ID &&
    isSameAddress(nativeOnChain(supportedSentChain).wrapped.address, received.asset.address)
  ) {
    return i18n.t('common.wrapped')
  } else if (
    received.tokenStandard === NATIVE_CHAIN_ID &&
    isSameAddress(nativeOnChain(supportedReceivedChain).wrapped.address, received.asset.address)
  ) {
    return i18n.t('common.unwrapped')
  } else {
    return i18n.t('common.swapped')
  }
}

function getSwapDescriptor({
  tokenIn,
  inputAmount,
  tokenOut,
  outputAmount,
}: {
  tokenIn: TokenAssetPartsFragment
  outputAmount: string
  tokenOut: TokenAssetPartsFragment
  inputAmount: string
}) {
  return i18n.t('activity.transaction.swap.descriptor', {
    amountWithSymbolA: `${inputAmount} ${tokenIn.symbol}`,
    amountWithSymbolB: `${outputAmount} ${tokenOut.symbol}`,
  })
}

function getChainIdFromGqlTokenOrCurrency(token?: TokenAssetPartsFragment | Currency): number | null {
  if (!token) {
    return null
  }
  if ('chainId' in token) {
    return token.chainId
  }
  return supportedChainIdFromGQLChain(token.chain) ?? null
}

const StyledBridgeAmountText = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  variant: 'body2',
})

export function getBridgeDescriptor({
  tokenIn,
  inputAmount,
  tokenOut,
  outputAmount,
}: {
  tokenIn?: TokenAssetPartsFragment | Currency
  outputAmount: string
  tokenOut?: TokenAssetPartsFragment | Currency
  inputAmount: string
}) {
  const inputChain = getChainIdFromGqlTokenOrCurrency(tokenIn)
  const outputChain = getChainIdFromGqlTokenOrCurrency(tokenOut)
  return (
    <Flex row alignItems="center" gap="4px">
      <NetworkLogo chainId={inputChain} size={16} borderRadius={6} />
      <StyledBridgeAmountText>
        {inputAmount}&nbsp;{tokenIn?.symbol ?? i18n.t('common.unknown')}
      </StyledBridgeAmountText>
      <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
      <NetworkLogo chainId={outputChain} size={16} borderRadius={6} />
      <StyledBridgeAmountText>
        {outputAmount}&nbsp;{tokenOut?.symbol ?? i18n.t('common.unknown')}
      </StyledBridgeAmountText>
    </Flex>
  )
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed & formatted USD value as a string if currency is of type USD
 */
function getTransactedValue(transactedValue: TokenTransferPartsFragment['transactedValue']): number | undefined {
  if (!transactedValue) {
    return undefined
  }
  const price = transactedValue.currency === GQLCurrency.Usd ? transactedValue.value : undefined
  return price
}

type SwapAmounts = {
  inputAmount: string
  inputAmountRaw: string
  inputCurrencyAddress: string
  outputAmount: string
  outputAmountRaw: string
  outputCurrencyAddress: string
  sent: TokenTransferPartsFragment
  received: TokenTransferPartsFragment
}

// exported for testing
// eslint-disable-next-line import/no-unused-modules
export function parseSwapAmounts(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
): SwapAmounts | undefined {
  const sent = changes.TokenTransfer.find((t) => t.direction === 'OUT')
  // Any leftover native token is refunded on exact_out swaps where the input token is native
  const refund = changes.TokenTransfer.find(
    (t) => t.direction === 'IN' && t.asset.id === sent?.asset.id && t.asset.standard === NATIVE_CHAIN_ID,
  )
  const received = changes.TokenTransfer.find((t) => t.direction === 'IN' && t !== refund)

  if (!sent || !received) {
    return undefined
  }

  const sentChainId = fromGraphQLChain(sent.asset.chain)
  const receivedChainId = fromGraphQLChain(received.asset.chain)

  if (!sentChainId || !receivedChainId) {
    return undefined
  }

  const inputCurrencyAddress =
    sent.asset.standard === NATIVE_CHAIN_ID ? getNativeAddress(sentChainId) : sent.asset.address
  const outputCurrencyAddress =
    received.asset.standard === NATIVE_CHAIN_ID ? getNativeAddress(receivedChainId) : received.asset.address
  if (!inputCurrencyAddress || !outputCurrencyAddress) {
    return undefined
  }

  const sentQuantity = parseUnits(sent.quantity, sent.asset.decimals)
  const refundQuantity = refund ? parseUnits(refund.quantity, refund.asset.decimals) : BigNumber.from(0)
  const receivedQuantity = parseUnits(received.quantity, received.asset.decimals)

  const adjustedInput = sentQuantity.sub(refundQuantity)
  const inputAmountRaw = adjustedInput.toString()
  const outputAmountRaw = receivedQuantity.toString()
  const inputAmount = formatNumberOrString({
    value: formatUnits(adjustedInput, sent.asset.decimals),
    type: NumberType.TokenNonTx,
  })
  const outputAmount = formatNumberOrString({ value: received.quantity, type: NumberType.TokenNonTx })
  return {
    sent,
    received,
    inputAmount,
    outputAmount,
    inputCurrencyAddress,
    outputCurrencyAddress,
    inputAmountRaw,
    outputAmountRaw,
  }
}

function parseSwap(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  if (changes.NftTransfer.length > 0 && changes.TokenTransfer.length === 1) {
    const collectionCounts = getCollectionCounts(changes.NftTransfer)

    const title = changes.NftTransfer[0].direction === 'IN' ? i18n.t('common.bought') : i18n.t('common.sold')
    const descriptor = Object.entries(collectionCounts)
      .map(([collectionName, count]) => `${count} ${collectionName}`)
      .join()

    return { title, descriptor }
  }
  // Some swaps may have more than 2 transfers, e.g. swaps with fees on transfer
  if (changes.TokenTransfer.length >= 2) {
    const swapAmounts = parseSwapAmounts(changes, formatNumberOrString)

    if (swapAmounts) {
      const { sent, received, inputAmount, outputAmount } = swapAmounts
      return {
        title: getSwapTitle(sent, received),
        descriptor: getSwapDescriptor({ tokenIn: sent.asset, inputAmount, tokenOut: received.asset, outputAmount }),
        currencies: [gqlToCurrency(sent.asset), gqlToCurrency(received.asset)],
      }
    }
  }
  return { title: i18n.t('common.unknownSwap') }
}

function parseBridge(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const swapAmounts = parseSwapAmounts(changes, formatNumberOrString)

  if (swapAmounts) {
    const { sent, received, inputAmount, outputAmount } = swapAmounts
    return {
      title: getSwapTitle(sent, received),
      descriptor: getBridgeDescriptor({ tokenIn: sent.asset, inputAmount, tokenOut: received.asset, outputAmount }),
      currencies: [gqlToCurrency(sent.asset), gqlToCurrency(received.asset)],
    }
  }
  return { title: i18n.t('common.unknownBridge') }
}

function parseV2PositionCreation(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const lpTokenIndex = changes.TokenTransfer.findIndex(
    (transfer) => transfer.asset.symbol === 'UNI-V2' && transfer.direction === TransactionDirection.In,
  )
  const transfers = changes.TokenTransfer.filter(
    (transfer, i) => i !== lpTokenIndex && transfer.direction === TransactionDirection.Out,
  )

  if (lpTokenIndex > -1 && transfers.length === 2) {
    return {
      title: i18n.t('pool.createdPosition'),
      ...parseLPTransfers(
        {
          ...changes,
          TokenTransfer: transfers,
        },
        formatNumberOrString,
      ),
    }
  }

  return undefined
}

/**
 * Wrap/unwrap transactions are labelled as lend transactions on the backend.
 * This function parses the transaction changes to determine if the transaction is a wrap/unwrap transaction.
 */
function parseLend(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const native = changes.TokenTransfer.find((t) => t.tokenStandard === NATIVE_CHAIN_ID)?.asset
  const erc20 = changes.TokenTransfer.find((t) => t.tokenStandard === 'ERC20')?.asset
  if (native && erc20 && gqlToCurrency(native)?.wrapped.address === gqlToCurrency(erc20)?.wrapped.address) {
    return parseSwap(changes, formatNumberOrString)
  }
  // Edge case: v2 position creation
  const v2PositionCreation = parseV2PositionCreation(changes, formatNumberOrString)
  if (v2PositionCreation) {
    return v2PositionCreation
  }

  return { title: i18n.t('common.unknownLend') }
}

function parseSwapOrder(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity,
) {
  const offchainOrderDetails = offchainOrderDetailsFromGraphQLTransactionActivity(
    assetActivity,
    changes,
    formatNumberOrString,
  )
  return {
    ...parseSwap(changes, formatNumberOrString),
    prefixIconSrc: UniswapXBolt,
    offchainOrderDetails,
  }
}

export function offchainOrderDetailsFromGraphQLTransactionActivity(
  activity: AssetActivityPartsFragment & { details: TransactionDetailsPartsFragment },
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
): UniswapXOrderDetails | undefined {
  const chainId = supportedChainIdFromGQLChain(activity.chain)
  if (!chainId) {
    return undefined
  }
  if (changes.TokenTransfer.length < 2) {
    return undefined
  }

  const swapAmounts = parseSwapAmounts(changes, formatNumberOrString)

  if (!swapAmounts) {
    return undefined
  }

  const { inputCurrencyAddress, outputCurrencyAddress, inputAmountRaw, outputAmountRaw } = swapAmounts

  return {
    orderHash: activity.details.hash,
    id: activity.details.id,
    offerer: activity.details.from,
    txHash: activity.details.hash,
    chainId,
    status: UniswapXOrderStatus.FILLED,
    addedTime: activity.timestamp,
    swapInfo: {
      isUniswapXOrder: true,
      type: UniswapTransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId: buildCurrencyId(chainId, inputCurrencyAddress),
      outputCurrencyId: buildCurrencyId(chainId, outputCurrencyAddress),
      inputCurrencyAmountRaw: inputAmountRaw,
      expectedOutputCurrencyAmountRaw: outputAmountRaw,
      minimumOutputCurrencyAmountRaw: outputAmountRaw,
      settledOutputCurrencyAmountRaw: outputAmountRaw,
    },
  }
}

function parseApprove(changes: TransactionChanges) {
  if (changes.TokenApproval.length === 1) {
    const title =
      parseInt(changes.TokenApproval[0].quantity) === 0 ? i18n.t('common.revokedApproval') : i18n.t('common.approved')
    const descriptor = `${changes.TokenApproval[0].asset.symbol}`
    const currencies = [gqlToCurrency(changes.TokenApproval[0].asset)]
    return { title, descriptor, currencies }
  }
  return { title: i18n.t('common.unknownApproval') }
}

function parseLPTransfers(changes: TransactionChanges, formatNumberOrString: FormatNumberOrStringFunctionType) {
  const poolTokenA = changes.TokenTransfer[0]
  const poolTokenB = changes.TokenTransfer[1]

  const tokenAQuanitity = formatNumberOrString({ value: poolTokenA.quantity, type: NumberType.TokenNonTx })
  const tokenBQuantity = formatNumberOrString({ value: poolTokenB.quantity, type: NumberType.TokenNonTx })

  return {
    descriptor: i18n.t('activity.transaction.tokens.descriptor', {
      amountWithSymbolA: `${tokenAQuanitity} ${poolTokenA.asset.symbol}`,
      amountWithSymbolB: `${tokenBQuantity} ${poolTokenB.asset.symbol}`,
    }),
    logos: [poolTokenA.asset.project?.logo?.url, poolTokenB.asset.project?.logo?.url],
    currencies: [gqlToCurrency(poolTokenA.asset), gqlToCurrency(poolTokenB.asset)],
  }
}

type TransactionActivity = AssetActivityPartsFragment & { details: TransactionDetailsPartsFragment }
type FiatOnRampActivity = AssetActivityPartsFragment & { details: OnRampTransactionDetailsPartsFragment }
type FiatOffRampActivity = AssetActivityPartsFragment & { details: OffRampTransactionDetailsPartsFragment }

function parseSendReceive(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity,
) {
  // TODO(cartcrom): remove edge cases after backend implements
  // Edge case: Receiving two token transfers in interaction w/ V3 manager === removing liquidity. These edge cases should potentially be moved to backend
  if (
    callsPositionManagerContract(assetActivity) &&
    (changes.TokenTransfer.length === 1 || changes.TokenTransfer.length === 2)
  ) {
    if (assetActivity.details.type === TransactionType.Send) {
      return { title: i18n.t('common.addedLiquidity'), ...parseLPTransfers(changes, formatNumberOrString) }
    } else {
      return { title: i18n.t('common.removedLiquidity'), ...parseLPTransfers(changes, formatNumberOrString) }
    }
  }

  let transfer: NftTransferPartsFragment | TokenTransferPartsFragment | undefined
  let assetName: string | undefined
  let amount: string | undefined
  let currencies: (Currency | undefined)[] | undefined
  if (changes.NftTransfer.length === 1) {
    transfer = changes.NftTransfer[0]
    assetName = transfer.asset.collection?.name
    amount = '1'
  } else if (changes.TokenTransfer.length === 1) {
    transfer = changes.TokenTransfer[0]
    assetName = transfer.asset.symbol
    amount = formatNumberOrString({ value: transfer.quantity, type: NumberType.TokenNonTx })
    currencies = [gqlToCurrency(transfer.asset)]
  }

  if (transfer && assetName && amount) {
    const isMoonpayPurchase = MOONPAY_SENDER_ADDRESSES.some((address) => isSameAddress(address, transfer?.sender))
    const otherAccount = isAddress(transfer.recipient) || undefined

    if (transfer.direction === 'IN') {
      return isMoonpayPurchase && transfer.__typename === 'TokenTransfer'
        ? {
            title: i18n.t('common.purchased'),
            descriptor: i18n.t('activity.transaction.swap.descriptor', {
              amountWithSymbolA: `${amount} ${assetName}`,
              amountWithSymbolB: formatNumberOrString({
                value: getTransactedValue(transfer.transactedValue),
                type: NumberType.FiatTokenPrice,
              }),
            }),
            logos: [moonpayLogoSrc],
            currencies,
          }
        : {
            title: i18n.t('common.received'),
            descriptor: i18n.t('activity.transaction.receive.descriptor', {
              amountWithSymbol: `${amount} ${assetName}`,
              walletAddress: otherAccount,
            }),
            otherAccount,
            currencies,
          }
    } else {
      return {
        title: i18n.t('common.sent'),
        descriptor: i18n.t('activity.transaction.send.descriptor', {
          amountWithSymbol: `${amount} ${assetName}`,
          walletAddress: otherAccount,
        }),
        otherAccount,
        currencies,
      }
    }
  }
  return { title: i18n.t('common.unknownSend') }
}

function parseMint(
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity,
) {
  const collectionMap = getCollectionCounts(changes.NftTransfer)
  if (Object.keys(collectionMap).length === 1) {
    const collectionName = Object.keys(collectionMap)[0]

    // Edge case: Minting a v3 positon represents adding liquidity
    if (
      callsPositionManagerContract(assetActivity) &&
      (changes.TokenTransfer.length === 1 || changes.TokenTransfer.length === 2)
    ) {
      if (callsV3PositionManagerContract(assetActivity)) {
        return { title: i18n.t('common.addedLiquidity'), ...parseLPTransfers(changes, formatNumberOrString) }
      }

      if (callsV4PositionManagerContract(assetActivity)) {
        return { title: i18n.t('pool.createdPosition'), ...parseLPTransfers(changes, formatNumberOrString) }
      }
    }
    return { title: i18n.t('common.minted'), descriptor: `${collectionMap[collectionName]} ${collectionName}` }
  }
  return { title: i18n.t('common.unknownMint') }
}

function parseUnknown(
  _changes: TransactionChanges,
  _formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity,
) {
  return { title: i18n.t('common.contractInteraction'), ...COMMON_CONTRACTS[assetActivity.details.to.toLowerCase()] }
}

type TransactionTypeParser = (
  changes: TransactionChanges,
  formatNumberOrString: FormatNumberOrStringFunctionType,
  assetActivity: TransactionActivity,
) => Partial<Activity>
const ActivityParserByType: { [key: string]: TransactionTypeParser | undefined } = {
  [TransactionType.Swap]: parseSwap,
  [TransactionType.Lend]: parseLend,
  [TransactionType.SwapOrder]: parseSwapOrder,
  [TransactionType.Approve]: parseApprove,
  [TransactionType.Send]: parseSendReceive,
  [TransactionType.Receive]: parseSendReceive,
  [TransactionType.Mint]: parseMint,
  [TransactionType.Bridging]: parseBridge,
  [TransactionType.Unknown]: parseUnknown,
}

function getLogoSrcs(changes: TransactionChanges): Array<string | undefined> {
  // Uses set to avoid duplicate logos (e.g. nft's w/ same image url)
  const logoSet = new Set<string | undefined>()
  // Uses only NFT logos if they are present (will not combine nft image w/ token image)
  if (changes.NftTransfer.length > 0) {
    changes.NftTransfer.forEach((nftChange) => logoSet.add(nftChange.asset.image?.url))
  } else {
    changes.TokenTransfer.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
    changes.TokenApproval.forEach((tokenChange) => logoSet.add(tokenChange.asset.project?.logo?.url))
  }
  return Array.from(logoSet)
}

function parseUniswapXOrder(activity: OrderActivity): Activity | undefined {
  const signature = parseRemoteSignature(activity)

  // If the order is open, do not render it.
  if (signature.status === UniswapXOrderStatus.OPEN) {
    return undefined
  }

  const { inputToken, inputTokenQuantity, outputToken, outputTokenQuantity } = activity.details

  const OrderTextTable = getOrderTextTable()
  const LimitOrderTextTable = getLimitOrderTextTable()

  const orderTextTableEntry =
    signature.type === SignatureType.SIGN_LIMIT
      ? LimitOrderTextTable[signature.status]
      : OrderTextTable[signature.status]

  const title = orderTextTableEntry.getTitle()

  return {
    hash: signature.orderHash,
    chainId: signature.chainId,
    offchainOrderDetails: signature,
    timestamp: activity.timestamp,
    logos: [inputToken.project?.logo?.url, outputToken.project?.logo?.url],
    currencies: [gqlToCurrency(inputToken), gqlToCurrency(outputToken)],
    descriptor: getSwapDescriptor({
      tokenIn: inputToken,
      inputAmount: inputTokenQuantity,
      tokenOut: outputToken,
      outputAmount: outputTokenQuantity,
    }),
    from: signature.offerer,
    prefixIconSrc: UniswapXBolt,
    title,
    status: orderTextTableEntry.status,
  }
}

function parseFiatOnRampTransaction(activity: TransactionActivity | FiatOnRampActivity): Activity {
  const chainId = supportedChainIdFromGQLChain(activity.chain)
  if (!chainId) {
    const error = new Error('Invalid activity from unsupported chain received from GQL')
    logger.error(error, {
      tags: {
        file: 'parseRemote',
        function: 'parseRemote',
      },
      extra: { activity },
    })
    throw error
  }

  switch (activity.details.__typename) {
    case 'OnRampTransactionDetails': {
      const onRampTransfer = activity.details.onRampTransfer
      return {
        from: activity.details.receiverAddress,
        hash: activity.id,
        chainId,
        timestamp: activity.timestamp,
        logos: [onRampTransfer.token.project?.logoUrl],
        currencies: [gqlToCurrency(onRampTransfer.token)],
        title: i18n.t('fiatOnRamp.purchasedOn', {
          serviceProvider: onRampTransfer.serviceProvider.name,
        }),
        descriptor: i18n.t('fiatOnRamp.exchangeRate', {
          outputAmount: onRampTransfer.amount,
          outputSymbol: onRampTransfer.token.symbol,
          inputAmount: onRampTransfer.sourceAmount,
          inputSymbol: onRampTransfer.sourceCurrency,
        }),
        suffixIconSrc: onRampTransfer.serviceProvider.logoDarkUrl,
        status: convertGQLTransactionStatus(activity.details.status),
      }
    }
    case 'TransactionDetails': {
      const assetChange = activity.details.assetChanges[0]
      if (assetChange?.__typename !== 'OnRampTransfer') {
        logger.error('Unexpected asset change type, expected OnRampTransfer', {
          tags: {
            file: 'parseRemote',
            function: 'parseRemote',
          },
        })
      }
      const onRampTransfer = assetChange as OnRampTransferPartsFragment
      return {
        from: activity.details.from,
        hash: activity.details.hash,
        chainId,
        timestamp: activity.timestamp,
        logos: [onRampTransfer.token.project?.logoUrl],
        currencies: [gqlToCurrency(onRampTransfer.token)],
        title: i18n.t('fiatOnRamp.purchasedOn', {
          serviceProvider: onRampTransfer.serviceProvider.name,
        }),
        descriptor: i18n.t('fiatOnRamp.exchangeRate', {
          outputAmount: onRampTransfer.amount,
          outputSymbol: onRampTransfer.token.symbol,
          inputAmount: onRampTransfer.sourceAmount,
          inputSymbol: onRampTransfer.sourceCurrency,
        }),
        suffixIconSrc: onRampTransfer.serviceProvider.logoDarkUrl,
        status: convertGQLTransactionStatus(activity.details.status),
      }
    }
    default: {
      const error = new Error('Invalid Fiat On Ramp activity type received from GQL')
      logger.error(error, {
        tags: {
          file: 'parseRemote',
          function: 'parseFiatOnRampTransaction',
        },
        extra: { activity },
      })
      throw error
    }
  }
}

function parseFiatOffRampTransaction(activity: FiatOffRampActivity): Activity {
  const chainId = supportedChainIdFromGQLChain(activity.chain)
  if (!chainId) {
    const error = new Error('Invalid activity from unsupported chain received from GQL')
    logger.error(error, {
      tags: {
        file: 'parseRemote',
        function: 'parseRemote',
      },
      extra: { activity },
    })
    throw error
  }

  const { offRampTransfer } = activity.details
  return {
    from: activity.details.senderAddress,
    hash: activity.id,
    chainId,
    timestamp: activity.timestamp,
    logos: [offRampTransfer.token.project?.logoUrl],
    currencies: [gqlToCurrency(offRampTransfer.token)],
    title: i18n.t('transaction.status.sale.successOn', {
      serviceProvider: offRampTransfer.serviceProvider.name,
    }),
    descriptor: i18n.t('fiatOffRamp.exchangeRate', {
      inputAmount: offRampTransfer.amount,
      inputSymbol: offRampTransfer.token.symbol,
      outputAmount: offRampTransfer.destinationAmount,
      outputSymbol: offRampTransfer.destinationCurrency,
    }),
    suffixIconSrc: offRampTransfer.serviceProvider.logoDarkUrl,
    status: convertGQLTransactionStatus(activity.details.status),
  }
}

function parseRemoteActivity(
  assetActivity: AssetActivityPartsFragment | undefined,
  account: string,
  formatNumberOrString: FormatNumberOrStringFunctionType,
): Activity | undefined {
  try {
    if (!assetActivity) {
      return undefined
    }

    if (assetActivity.details.__typename === 'OffRampTransactionDetails') {
      return parseFiatOffRampTransaction(assetActivity as FiatOffRampActivity)
    }

    if (assetActivity.details.__typename === 'SwapOrderDetails') {
      // UniswapX orders are returned as SwapOrderDetails until they are filled onchain, at which point they are returned as TransactionDetails
      return parseUniswapXOrder(assetActivity as OrderActivity)
    }

    if (
      assetActivity.details.__typename === 'OnRampTransactionDetails' ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (assetActivity.details.__typename === 'TransactionDetails' &&
        assetActivity.details.type === TransactionType.OnRamp)
    ) {
      return parseFiatOnRampTransaction(assetActivity as TransactionActivity)
    }

    const changes = assetActivity.details.assetChanges.reduce(
      (acc: TransactionChanges, assetChange) => {
        if (assetChange?.__typename === 'NftApproval') {
          acc.NftApproval.push(assetChange)
        } else if (assetChange?.__typename === 'NftApproveForAll') {
          acc.NftApproveForAll.push(assetChange)
        } else if (assetChange?.__typename === 'NftTransfer') {
          acc.NftTransfer.push(assetChange)
        } else if (assetChange?.__typename === 'TokenTransfer') {
          acc.TokenTransfer.push(assetChange)
        } else if (assetChange?.__typename === 'TokenApproval') {
          acc.TokenApproval.push(assetChange)
        }

        return acc
      },
      { NftTransfer: [], TokenTransfer: [], TokenApproval: [], NftApproval: [], NftApproveForAll: [] },
    )

    const supportedChain = supportedChainIdFromGQLChain(assetActivity.chain)
    if (!supportedChain) {
      logger.error(new Error('Invalid activity from unsupported chain received from GQL'), {
        tags: {
          file: 'parseRemote',
          function: 'parseRemoteActivity',
        },
        extra: { assetActivity },
      })
      return undefined
    }

    const defaultFields = {
      hash: assetActivity.details.hash,
      chainId: supportedChain,
      status: convertGQLTransactionStatus(assetActivity.details.status),
      timestamp: assetActivity.timestamp,
      logos: getLogoSrcs(changes),
      title: assetActivity.details.type,
      descriptor: assetActivity.details.to,
      from: assetActivity.details.from,
      nonce: assetActivity.details.nonce,
      isSpam: isSpam(changes, assetActivity.details, account),
      type: assetActivity.details.type,
    }

    const parsedFields = ActivityParserByType[assetActivity.details.type]?.(
      changes,
      formatNumberOrString,
      assetActivity as TransactionActivity,
    )
    return { ...defaultFields, ...parsedFields }
  } catch (e) {
    logger.debug('parseRemote', 'parseRemoteActivity', 'Failed to parse remote activity', {
      error: e,
      extra: { assetActivity },
    })
    return undefined
  }
}

export function parseRemoteActivities(
  assetActivities: (AssetActivityPartsFragment | undefined)[] | undefined,
  account: string,
  formatNumberOrString: FormatNumberOrStringFunctionType,
) {
  return assetActivities?.reduce((acc: { [hash: string]: Activity }, assetActivity) => {
    const activity = parseRemoteActivity(assetActivity, account, formatNumberOrString)
    if (activity) {
      acc[activity.hash] = activity
    }
    return acc
  }, {})
}

const getTimeSince = (timestamp: number) => {
  const seconds = Math.floor(Date.now() - timestamp * 1000)

  let interval
  // TODO(cartcrom): use locale to determine date shorthands to use for non-english
  if ((interval = seconds / ms(`1y`)) > 1) {
    return Math.floor(interval) + 'y'
  }
  if ((interval = seconds / ms(`30d`)) > 1) {
    return Math.floor(interval) + 'mo'
  }
  if ((interval = seconds / ms(`1d`)) > 1) {
    return Math.floor(interval) + 'd'
  }
  if ((interval = seconds / ms(`1h`)) > 1) {
    return Math.floor(interval) + 'h'
  }
  if ((interval = seconds / ms(`1m`)) > 1) {
    return Math.floor(interval) + 'm'
  } else {
    return Math.floor(seconds / ms(`1s`)) + 's'
  }
}

/**
 * Keeps track of the time since a given timestamp, keeping it up to date every second when necessary
 * @param timestamp
 * @returns
 */
export function useTimeSince(timestamp: number) {
  const [timeSince, setTimeSince] = useState<string>(getTimeSince(timestamp))

  useEffect(() => {
    const refreshTime = () =>
      setTimeout(() => {
        if (Math.floor(Date.now() - timestamp * 1000) / ms(`61s`) <= 1) {
          setTimeSince(getTimeSince(timestamp))
          timeout = refreshTime()
        }
      }, ms(`1s`))

    let timeout: NodeJS.Timeout | undefined = refreshTime()

    return () => {
      timeout && clearTimeout(timeout)
    }
  }, [timestamp])

  return timeSince
}
