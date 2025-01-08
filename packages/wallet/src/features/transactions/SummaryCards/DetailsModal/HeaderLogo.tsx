import { Flex, useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
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
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DappLogoWithWCBadge, LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import {
  SwapTypeTransactionInfo,
  isApproveTransactionInfo,
  isBridgeTransactionInfo,
  isLocalOffRampTransactionInfo,
  isLocalOnRampTransactionInfo,
  isNFTApproveTransactionInfo,
  isNFTMintTransactionInfo,
  isNFTTradeTransactionInfo,
  isOffRampSaleTransactionInfo,
  isOnRampPurchaseTransactionInfo,
  isOnRampTransferTransactionInfo,
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
  isSwapTransactionInfo,
  isWCConfirmTransactionInfo,
  isWrapTransactionInfo,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'

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

export function HeaderLogo({ transactionDetails }: HeaderLogoProps): JSX.Element | null {
  const { typeInfo } = transactionDetails

  const getHeaderLogoComponent = (): JSX.Element | null => {
    if (isApproveTransactionInfo(typeInfo)) {
      return <ApproveHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isNFTApproveTransactionInfo(typeInfo)) {
      return <NFTHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isNFTMintTransactionInfo(typeInfo)) {
      return <NFTHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isNFTTradeTransactionInfo(typeInfo)) {
      return <NFTHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isReceiveTokenTransactionInfo(typeInfo)) {
      return <TokenTransferHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isSendTokenTransactionInfo(typeInfo)) {
      return <TokenTransferHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isSwapTransactionInfo(typeInfo)) {
      return <SwapHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isBridgeTransactionInfo(typeInfo)) {
      return <BridgeHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isWCConfirmTransactionInfo(typeInfo)) {
      return <WCConfirmHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isWrapTransactionInfo(typeInfo)) {
      return <WrapHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isOnRampPurchaseTransactionInfo(typeInfo) || isOnRampTransferTransactionInfo(typeInfo)) {
      return <OnRampHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isOffRampSaleTransactionInfo(typeInfo)) {
      return <OffRampHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isLocalOnRampTransactionInfo(typeInfo) || isLocalOffRampTransactionInfo(typeInfo)) {
      return null // Local FOR transactions are never visible
    } else {
      return <UnknownHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    }
  }

  return <Flex>{getHeaderLogoComponent()}</Flex>
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

function ApproveHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<ApproveTransactionInfo>): JSX.Element {
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress))
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
      dappImageUrl={typeInfo.dapp.icon}
      dappName={typeInfo.dapp.name}
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
}: SpecificHeaderLogoProps<UnknownTransactionInfo>): JSX.Element {
  const colors = useSporeColors()
  return typeInfo.dappInfo?.icon ? (
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
