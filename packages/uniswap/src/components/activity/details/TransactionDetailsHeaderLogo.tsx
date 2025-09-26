import { useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons/ContractInteraction'
import { iconSizes } from 'ui/src/theme'
import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { DappLogoWithWCBadge, LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { BridgeIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ClaimUniTransactionInfo,
  LiquidityTransactionBaseInfos,
  LpIncentivesClaimTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  Permit2ApproveTransactionInfo,
  ReceiveTokenTransactionInfo,
  RemoveDelegationTransactionInfo,
  SendCallsTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const TXN_DETAILS_ICON_SIZE = iconSizes.icon40

interface HeaderLogoProps {
  transactionDetails: TransactionDetails
}

const getLogoWithTxStatus = ({
  assetType,
  currencyInfo,
  transactionDetails,
  institutionLogoUrl,
  serviceProviderLogoUrl,
  nftImageUrl,
}: {
  assetType: AssetType
  transactionDetails: TransactionDetails
  currencyInfo?: Maybe<CurrencyInfo>
  institutionLogoUrl?: string
  serviceProviderLogoUrl?: string
  nftImageUrl?: string
}): JSX.Element => (
  <LogoWithTxStatus
    assetType={assetType}
    chainId={transactionDetails.chainId}
    currencyInfo={currencyInfo}
    institutionLogoUrl={institutionLogoUrl}
    nftImageUrl={nftImageUrl}
    serviceProviderLogoUrl={serviceProviderLogoUrl}
    size={TXN_DETAILS_ICON_SIZE}
    txStatus={transactionDetails.status}
    txType={transactionDetails.typeInfo.type}
  />
)

// eslint-disable-next-line complexity
export function TransactionDetailsHeaderLogo({ transactionDetails }: HeaderLogoProps): JSX.Element | null {
  const { typeInfo } = transactionDetails

  switch (typeInfo.type) {
    case TransactionType.Approve:
    case TransactionType.Permit2Approve:
      return <ApproveHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.NFTApprove:
    case TransactionType.NFTMint:
    case TransactionType.NFTTrade:
      return <NFTHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.Receive:
    case TransactionType.Send:
      return <TokenTransferHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.Swap:
      return <SwapHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.Bridge:
      return <BridgeHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.WCConfirm:
      return <WCConfirmHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.Wrap:
      return <WrapHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return <OnRampHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.OffRampSale:
      return <OffRampHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    case TransactionType.CreatePool:
    case TransactionType.CreatePair:
    case TransactionType.LiquidityIncrease:
    case TransactionType.LiquidityDecrease:
    case TransactionType.CollectFees:
    case TransactionType.MigrateLiquidityV3ToV4:
      return <LiquidityHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    // Local FOR transactions are never visible
    case TransactionType.LocalOnRamp:
    case TransactionType.LocalOffRamp:
      return null
    // TODO WALL-7056: Implement Remove Delegation Header Logo
    case TransactionType.SendCalls:
    case TransactionType.RemoveDelegation:
    case TransactionType.ClaimUni:
    case TransactionType.MigrateLiquidityV2ToV3:
    case TransactionType.LPIncentivesClaimRewards:
    default:
      return <UnknownHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
  }
}

interface SpecificHeaderLogoProps<T> extends HeaderLogoProps {
  typeInfo: T
}

function BridgeHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<BridgeTransactionInfo>): JSX.Element {
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  return (
    <SplitLogo
      inputCurrencyInfo={inputCurrency}
      outputCurrencyInfo={outputCurrency}
      size={TXN_DETAILS_ICON_SIZE}
      chainId={transactionDetails.chainId}
      customIcon={BridgeIcon}
    />
  )
}

function SwapHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<SwapTypeTransactionInfo>): JSX.Element {
  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  return (
    <SplitLogo
      chainId={transactionDetails.chainId}
      inputCurrencyInfo={inputCurrency}
      outputCurrencyInfo={outputCurrency}
      size={TXN_DETAILS_ICON_SIZE}
    />
  )
}

function LiquidityHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<LiquidityTransactionBaseInfos>): JSX.Element {
  const inputCurrency = useCurrencyInfo(typeInfo.currency0Id)
  const outputCurrency = useCurrencyInfo(typeInfo.currency1Id)

  return (
    <SplitLogo
      chainId={transactionDetails.chainId}
      inputCurrencyInfo={inputCurrency}
      outputCurrencyInfo={outputCurrency}
      size={TXN_DETAILS_ICON_SIZE}
    />
  )
}

function ApproveHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<ApproveTransactionInfo | Permit2ApproveTransactionInfo>): JSX.Element {
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress ?? ''))

  if (!currencyInfo && typeInfo.type === TransactionType.Permit2Approve) {
    return <UnknownHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
  }

  return getLogoWithTxStatus({
    assetType: AssetType.Currency,
    currencyInfo,
    transactionDetails,
  })
}

function TokenTransferHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<ReceiveTokenTransactionInfo | SendTokenTransactionInfo>): JSX.Element {
  const currencyInfo = useCurrencyInfo(
    typeInfo.assetType === AssetType.Currency
      ? buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress)
      : undefined,
  )
  return getLogoWithTxStatus({
    assetType: typeInfo.assetType,
    currencyInfo,
    transactionDetails,
    nftImageUrl: typeInfo.assetType !== AssetType.Currency ? typeInfo.nftSummaryInfo?.imageURL : undefined,
  })
}

function OnRampHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<OnRampPurchaseInfo | OnRampTransferInfo>): JSX.Element {
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.destinationTokenAddress))
  return getLogoWithTxStatus({
    assetType: AssetType.Currency,
    currencyInfo,
    transactionDetails,
  })
}

function OffRampHeaderLogo({ transactionDetails, typeInfo }: SpecificHeaderLogoProps<OffRampSaleInfo>): JSX.Element {
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.destinationTokenAddress))
  return getLogoWithTxStatus({
    assetType: AssetType.Currency,
    currencyInfo,
    transactionDetails,
  })
}

function NFTHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<NFTApproveTransactionInfo | NFTMintTransactionInfo | NFTTradeTransactionInfo>): JSX.Element {
  return getLogoWithTxStatus({
    assetType: AssetType.ERC721,
    transactionDetails,
    nftImageUrl: typeInfo.nftSummaryInfo.imageURL,
  })
}

function WCConfirmHeaderLogo({ transactionDetails, typeInfo }: SpecificHeaderLogoProps<WCConfirmInfo>): JSX.Element {
  return (
    <DappLogoWithWCBadge
      chainId={transactionDetails.chainId}
      dappImageUrl={typeInfo.dappRequestInfo.icon}
      dappName={typeInfo.dappRequestInfo.name}
      size={TXN_DETAILS_ICON_SIZE}
    />
  )
}

function WrapHeaderLogo({ transactionDetails, typeInfo }: SpecificHeaderLogoProps<WrapTransactionInfo>): JSX.Element {
  const unwrapped = typeInfo.unwrapped
  const nativeCurrencyInfo = useNativeCurrencyInfo(transactionDetails.chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(transactionDetails.chainId)

  return (
    <SplitLogo
      chainId={transactionDetails.chainId}
      inputCurrencyInfo={unwrapped ? wrappedCurrencyInfo : nativeCurrencyInfo}
      outputCurrencyInfo={unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo}
      size={TXN_DETAILS_ICON_SIZE}
    />
  )
}

function UnknownHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<
  | UnknownTransactionInfo
  | SendCallsTransactionInfo
  | Permit2ApproveTransactionInfo
  | RemoveDelegationTransactionInfo
  | ClaimUniTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | LpIncentivesClaimTransactionInfo
>): JSX.Element {
  const colors = useSporeColors()
  // Check if dappInfo exists since it may not exist on all transaction types
  return 'dappInfo' in typeInfo && typeInfo.dappInfo?.icon ? (
    <DappLogoWithWCBadge
      circular
      hideWCBadge
      chainId={transactionDetails.chainId}
      dappImageUrl={typeInfo.dappInfo.icon}
      dappName={typeInfo.dappInfo.name ?? ''}
      size={iconSizes.icon40}
    />
  ) : (
    <ContractInteraction color="$neutral2" fill={colors.surface1.get()} size="$icon.40" />
  )
}
