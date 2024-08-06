/* eslint-disable complexity */
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Flex,
  Text,
  TouchableArea,
  UniswapXText,
  UniversalImage,
  UniversalImageResizeMode,
  useIsDarkMode,
} from 'ui/src'
import { CopyAlt, ExternalLink, UniswapX, Unitag } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useENS } from 'wallet/src/features/ens/useENS'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useNetworkFee } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/hooks'
import { SwapTypeTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import {
  getFormattedSwapRatio,
  hasInterfaceFees,
  shortenHash,
} from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'
import { getAmountsFromTrade } from 'wallet/src/features/transactions/getAmountsFromTrade'
import { isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

const UNISWAP_FEE = 0.0025

export function TransactionDetailsInfoRows({
  transactionDetails,
  isShowingMore,
}: {
  transactionDetails: TransactionDetails
  isShowingMore: boolean
}): JSX.Element {
  const rows = useTransactionDetailsInfoRows(transactionDetails, isShowingMore)

  return (
    <Flex gap="$spacing8" px="$spacing8">
      {rows}
    </Flex>
  )
}

export function useTransactionDetailsInfoRows(
  transactionDetails: TransactionDetails,
  isShowingMore: boolean,
): JSX.Element[] {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const { typeInfo } = transactionDetails

  const defaultRows = [
    <NetworkFeeRow key="networkFee" transactionDetails={transactionDetails} />,
    <TransactionHashRow key="transactionId" transactionDetails={transactionDetails} />,
  ]
  const specificRows: JSX.Element[] = []

  switch (typeInfo.type) {
    case TransactionType.Approve:
    case TransactionType.NFTApprove:
    case TransactionType.NFTMint:
      if (typeInfo.dappInfo && typeInfo.dappInfo.name) {
        specificRows.push(<DappInfoRow key="dappInfo" iconUrl={typeInfo.dappInfo.icon} name={typeInfo.dappInfo.name} />)
      }
      break
    case TransactionType.WCConfirm:
      specificRows.push(<DappInfoRow key="dappInfo" iconUrl={typeInfo.dapp.icon} name={typeInfo.dapp.name} />)
      break
    case TransactionType.Receive:
      specificRows.push(<TransactionParticipantRow key="txnParticipant" address={typeInfo.sender} />)
      break
    case TransactionType.Send:
      specificRows.push(<TransactionParticipantRow key="txnParticipant" isSend address={typeInfo.recipient} />)
      break
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      specificRows.push(
        <InfoRow key="onRampSender" label={t('transaction.details.from')}>
          <UniversalImage
            size={{
              width: iconSizes.icon16,
              height: iconSizes.icon16,
              resizeMode: UniversalImageResizeMode.Contain,
            }}
            style={{
              image: {
                borderRadius: borderRadii.rounded4,
              },
            }}
            uri={isDarkMode ? typeInfo.serviceProvider.logoDarkUrl : typeInfo.serviceProvider.logoLightUrl}
          />
          <Text variant="body3">{typeInfo.serviceProvider.name}</Text>
        </InfoRow>,
      )
      break
    case TransactionType.Swap:
      if (isShowingMore) {
        specificRows.push(<SwapRateRow key="swapRate" typeInfo={typeInfo} />)
        // TODO (WALL-4189): blocked on backend. This is hard-coded to always return false for now
        if (
          hasInterfaceFees({
            swapTimestampMs: transactionDetails.addedTime,
          })
        ) {
          specificRows.push(<UniswapFeeRow key="uniswapFee" typeInfo={typeInfo} />)
        }
      }
      break
    case TransactionType.Wrap:
    case TransactionType.FiatPurchase:
    case TransactionType.NFTTrade:
      // For now, these cases don't add any specific rows
      break

    case TransactionType.Unknown:
      if (typeInfo.dappInfo) {
        if (typeInfo.dappInfo.name) {
          specificRows.push(
            <DappInfoRow key="dappInfo" iconUrl={typeInfo.dappInfo.icon} name={typeInfo.dappInfo.name} />,
          )
        }
        specificRows.push(
          <InfoRow key="contract" label={t('common.text.contract')}>
            <Text variant="body3">{shortenAddress(typeInfo.dappInfo.address)}</Text>
            <TouchableArea
              onPress={async (): Promise<void> => {
                if (typeInfo.dappInfo?.address) {
                  await openUri(
                    getExplorerLink(transactionDetails.chainId, typeInfo.dappInfo.address, ExplorerDataType.ADDRESS),
                  )
                }
              }}
            >
              <ExternalLink color="$neutral3" size="$icon.16" />
            </TouchableArea>
          </InfoRow>,
        )
      }
      break
    default:
      break
  }

  // Combine specific rows and default rows
  // In the future, you can modify this logic to omit or change default rows for specific types
  return [...specificRows, ...defaultRows]
}

function NetworkFeeRow({ transactionDetails }: { transactionDetails: TransactionDetails }): JSX.Element {
  const { t } = useTranslation()
  const { value: networkFeeValue } = useNetworkFee(transactionDetails)

  const Logo = isUniswapX(transactionDetails) ? UniswapX : NetworkLogo
  const GasText = isUniswapX(transactionDetails) ? UniswapXText : Text
  return (
    <InfoRow key="networkFee" label={t('transaction.details.networkFee')}>
      <Logo chainId={transactionDetails.chainId} size={iconSizes.icon16} />
      <GasText variant="body3">{networkFeeValue}</GasText>
    </InfoRow>
  )
}

function TransactionHashRow({ transactionDetails }: { transactionDetails: TransactionDetails }): JSX.Element | null {
  const { hash } = transactionDetails
  const { t } = useTranslation()
  const dispatch = useDispatch()

  if (!hash && isUniswapX(transactionDetails)) {
    return null
  }

  const onPressCopy = async (): Promise<void> => {
    if (!hash) {
      return
    }

    await setClipboard(hash)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.TransactionId,
      }),
    )
  }

  return (
    <InfoRow key="transactionId" label={t('transaction.details.transactionId')}>
      <Text variant="body3">{shortenHash(hash)}</Text>
      <TouchableArea onPress={onPressCopy}>
        <CopyAlt color="$neutral3" size="$icon.16" />
      </TouchableArea>
    </InfoRow>
  )
}

function InfoRow({
  label,
  children,
}: PropsWithChildren & {
  label: string
}): JSX.Element {
  return (
    <ContentRow label={label} variant="body3">
      <Flex centered row gap="$spacing4">
        {children}
      </Flex>
    </ContentRow>
  )
}

function DappInfoRow({ name, iconUrl }: { name: string; iconUrl?: string | null }): JSX.Element {
  const { t } = useTranslation()
  return (
    <InfoRow label={t('transaction.details.dappName')}>
      {iconUrl && (
        <UniversalImage
          size={{
            width: iconSizes.icon16,
            height: iconSizes.icon16,
            resizeMode: UniversalImageResizeMode.Contain,
          }}
          style={{
            image: {
              borderRadius: borderRadii.roundedFull,
            },
          }}
          uri={iconUrl}
        />
      )}
      <Text variant="body3">{name}</Text>
    </InfoRow>
  )
}

function TransactionParticipantRow({ address, isSend = false }: { address: string; isSend?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const { name: ensName } = useENS(UniverseChainId.Mainnet, address, true)
  const { unitag } = useUnitagByAddress(address)
  const personDisplayName = unitag?.username ?? ensName ?? shortenAddress(address)
  return (
    <InfoRow label={isSend ? t('common.text.recipient') : t('common.text.sender')}>
      <Text variant="body3">{personDisplayName}</Text>
      {unitag?.username && <Unitag size="$icon.16" />}
    </InfoRow>
  )
}

function SwapRateRow({ typeInfo }: { typeInfo: SwapTypeTransactionInfo }): JSX.Element {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()

  const inputCurrency = useCurrencyInfo(typeInfo.inputCurrencyId)
  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)

  const formattedLine =
    inputCurrency && outputCurrency
      ? getFormattedSwapRatio({
          typeInfo,
          inputCurrency,
          outputCurrency,
          formatter,
        })
      : '-'

  return (
    <InfoRow label={t('transaction.details.swapRate')}>
      <Text variant="body3">{formattedLine}</Text>
    </InfoRow>
  )
}

function UniswapFeeRow({ typeInfo }: { typeInfo: SwapTypeTransactionInfo }): JSX.Element {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()

  const outputCurrency = useCurrencyInfo(typeInfo.outputCurrencyId)
  const { outputCurrencyAmountRaw } = getAmountsFromTrade(typeInfo)

  const currencyAmount = getCurrencyAmount({
    value: outputCurrencyAmountRaw,
    valueType: ValueType.Raw,
    currency: outputCurrency?.currency,
  })

  const amountExact = currencyAmount ? parseFloat(currencyAmount.toExact()) : null

  // Using the equation (1 - 0.25 / 100) * (actualOutputValue + uniswapFee) = actualOutputValue
  const approximateFee = amountExact ? (UNISWAP_FEE / (1 - UNISWAP_FEE)) * amountExact : null
  const feeSymbol = outputCurrency?.currency.symbol ? ' ' + outputCurrency.currency.symbol : ''
  const formattedApproximateFee = approximateFee
    ? '~' +
      formatter.formatNumberOrString({
        value: approximateFee,
        type: NumberType.TokenTx,
      }) +
      feeSymbol
    : '-'

  return (
    <InfoRow label={t('transaction.details.uniswapFee', { feePercent: UNISWAP_FEE * 100 })}>
      <Text variant="body3">{formattedApproximateFee}</Text>
    </InfoRow>
  )
}
