import { Flex, useIsDarkMode, useSporeColors } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { DappLogoWithWCBadge, LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import {
  useCurrencyInfo,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  SwapTypeTransactionInfo,
  isApproveTransactionInfo,
  isFiatPurchaseTransactionInfo,
  isNFTApproveTransactionInfo,
  isNFTMintTransactionInfo,
  isNFTTradeTransactionInfo,
  isOnRampPurchaseTransactionInfo,
  isOnRampTransferTransactionInfo,
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
  isSwapTransactionInfo,
  isWCConfirmTransactionInfo,
  isWrapTransactionInfo,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import {
  ApproveTransactionInfo,
  FiatPurchaseTransactionInfo,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'wallet/src/features/transactions/types'

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

export function HeaderLogo({ transactionDetails }: HeaderLogoProps): JSX.Element {
  const { typeInfo } = transactionDetails

  const getHeaderLogoComponent = (): JSX.Element => {
    if (isApproveTransactionInfo(typeInfo)) {
      return <ApproveHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isFiatPurchaseTransactionInfo(typeInfo)) {
      return <FiatPurchaseHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
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
    } else if (isWCConfirmTransactionInfo(typeInfo)) {
      return <WCConfirmHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isWrapTransactionInfo(typeInfo)) {
      return <WrapHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else if (isOnRampPurchaseTransactionInfo(typeInfo) || isOnRampTransferTransactionInfo(typeInfo)) {
      return <OnRampHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    } else {
      return <UnknownHeaderLogo transactionDetails={transactionDetails} typeInfo={typeInfo} />
    }
  }

  return <Flex>{getHeaderLogoComponent()}</Flex>
}

interface SpecificHeaderLogoProps<T> extends HeaderLogoProps {
  typeInfo: T
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

function FiatPurchaseHeaderLogo({
  transactionDetails,
  typeInfo,
}: SpecificHeaderLogoProps<FiatPurchaseTransactionInfo>): JSX.Element {
  const outputCurrencyInfo = useCurrencyInfo(
    typeInfo.outputCurrency?.metadata.contractAddress
      ? buildCurrencyId(transactionDetails.chainId, typeInfo.outputCurrency?.metadata.contractAddress)
      : undefined,
  )
  const serviceProviderLogoUrl = getOptionalServiceProviderLogo(typeInfo.serviceProviderLogo, useIsDarkMode())
  return getLogoWithTxStatus({
    assetType: AssetType.Currency,
    transactionDetails,
    currencyInfo: outputCurrencyInfo,
    institutionLogoUrl: typeInfo.institutionLogoUrl,
    serviceProviderLogoUrl,
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
