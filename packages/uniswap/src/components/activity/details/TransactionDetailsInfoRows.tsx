/* eslint-disable complexity */
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Flex,
  FlexProps,
  Loader,
  Text,
  TouchableArea,
  UniswapXText,
  UniversalImage,
  UniversalImageResizeMode,
  useIsDarkMode,
} from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { borderRadii, fonts, iconSizes } from 'ui/src/theme'
import { InfoRow } from 'uniswap/src/components/activity/details/InfoRow'
import { TransactionParticipantRow } from 'uniswap/src/components/activity/details/TransactionParticipantRow'
import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useNetworkFee } from 'uniswap/src/features/activity/hooks/useNetworkFee'
import { getFormattedSwapRatio, hasInterfaceFees } from 'uniswap/src/features/activity/utils/swapInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_TIME_MEDIUM, useFormattedDateTime } from 'uniswap/src/features/language/localizedDayjs'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  BridgeTransactionInfo,
  LiquidityTransactionBaseInfos,
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openTransactionLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress, shortenHash } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

const UNISWAP_FEE = 0.0025

export function TransactionDetailsInfoRows({
  transactionDetails,
  isShowingMore,
  pt,
  onClose,
}: {
  transactionDetails: TransactionDetails
  isShowingMore: boolean
  pt?: FlexProps['pt']
  onClose: () => void
}): JSX.Element {
  const rows = useTransactionDetailsInfoRows({ transactionDetails, isShowingMore, onClose })

  return (
    <Flex gap="$spacing8" px="$spacing8" pt={pt}>
      {rows}
    </Flex>
  )
}

function useTransactionDetailsInfoRows({
  transactionDetails,
  isShowingMore,
  onClose,
}: {
  transactionDetails: TransactionDetails
  isShowingMore: boolean
  onClose: () => void
}): JSX.Element[] {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const { typeInfo, addedTime } = transactionDetails
  const dateString = useFormattedDateTime(dayjs(addedTime), FORMAT_DATE_TIME_MEDIUM)

  const defaultRows = [
    <NetworkFeeRow key="networkFee" transactionDetails={transactionDetails} />,
    <TransactionHashRow key="transactionId" transactionDetails={transactionDetails} />,
    <InfoRow key="submittedOn" label={t('transaction.submittedOn')}>
      <Text variant="body3">{dateString}</Text>
    </InfoRow>,
  ]
  const specificRows: JSX.Element[] = []

  switch (typeInfo.type) {
    case TransactionType.Approve:
    case TransactionType.Permit2Approve:
    case TransactionType.NFTApprove:
    case TransactionType.NFTMint:
      if (typeInfo.dappInfo && typeInfo.dappInfo.name) {
        specificRows.push(
          <DappInfoRow
            key="dappInfo"
            label={t('transaction.details.dappName')}
            iconUrl={typeInfo.dappInfo.icon}
            name={typeInfo.dappInfo.name}
          />,
        )
      }
      break
    case TransactionType.WCConfirm:
      specificRows.push(
        <DappInfoRow
          key="dappInfo"
          label={t('transaction.details.dappName')}
          iconUrl={typeInfo.dappRequestInfo.icon}
          name={typeInfo.dappRequestInfo.name}
        />,
      )
      break
    case TransactionType.Receive:
      specificRows.push(<TransactionParticipantRow key="txnParticipant" address={typeInfo.sender} onClose={onClose} />)
      break
    case TransactionType.Send:
      specificRows.push(
        <TransactionParticipantRow key="txnParticipant" isSend address={typeInfo.recipient} onClose={onClose} />,
      )
      break
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      specificRows.push(<FORProviderRow key="forProvider" isDarkMode={isDarkMode} typeInfo={typeInfo} />)
      break
    case TransactionType.OffRampSale:
      specificRows.push(<FORProviderRow key="forProvider" isDarkMode={isDarkMode} typeInfo={typeInfo} />)
      specificRows.push(
        <InfoRow key="forFee" label={t('transaction.details.providerFee')}>
          <Text variant="body3">
            {typeInfo.transactionFee} {typeInfo.destinationTokenSymbol}
          </Text>
        </InfoRow>,
      )
      specificRows.push(<TransactionOfframpRow transactionId={typeInfo.providerTransactionId} />)
      break
    case TransactionType.Bridge:
      if (isShowingMore) {
        if (typeInfo.routingDappInfo && typeInfo.routingDappInfo.name) {
          const dappInfo = (
            <DappInfoRow
              key="dappInfo"
              label={t('swap.details.orderRouting')}
              iconUrl={typeInfo.routingDappInfo.icon}
              name={typeInfo.routingDappInfo.name}
            />
          )
          specificRows.splice(1, 0, dappInfo)
        }
        specificRows.push(<SwapRateRow key="swapRate" typeInfo={typeInfo} />)
      }
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
    case TransactionType.LiquidityIncrease:
    case TransactionType.LiquidityDecrease:
    case TransactionType.CollectFees:
    case TransactionType.CreatePair:
    case TransactionType.CreatePool:
      specificRows.push(<PoolRow key="pool" typeInfo={typeInfo} />)
      break
    case TransactionType.Wrap:
    case TransactionType.NFTTrade:
      // For now, these cases don't add any specific rows
      break

    case TransactionType.Unknown:
      if (typeInfo.dappInfo) {
        if (typeInfo.dappInfo.name) {
          specificRows.push(
            <DappInfoRow
              key="dappInfo"
              label={t('transaction.details.dappName')}
              iconUrl={typeInfo.dappInfo.icon}
              name={typeInfo.dappInfo.name}
            />,
          )
        }
        const address = typeInfo.dappInfo.address
        if (address) {
          specificRows.push(
            <InfoRow key="contract" label={t('common.text.contract')}>
              <Text variant="body3">{shortenAddress({ address })}</Text>
              <TouchableArea
                onPress={async (): Promise<void> => {
                  await openUri({
                    uri: getExplorerLink({
                      chainId: transactionDetails.chainId,
                      data: address,
                      type: ExplorerDataType.ADDRESS,
                    }),
                  })
                }}
              >
                <ExternalLink color="$neutral3" size="$icon.16" />
              </TouchableArea>
            </InfoRow>,
          )
        }
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
  const isLoading = networkFeeValue === '-'

  const Logo = isUniswapX(transactionDetails) ? UniswapX : NetworkLogo
  const GasText = isUniswapX(transactionDetails) ? UniswapXText : Text
  return (
    <InfoRow key="networkFee" label={t('transaction.details.networkFee')}>
      <Logo chainId={transactionDetails.chainId} size={iconSizes.icon16} />
      {isLoading ? (
        <Loader.Box height={fonts.body3.lineHeight} width={iconSizes.icon36} />
      ) : (
        <GasText variant="body3">{networkFeeValue}</GasText>
      )}
    </InfoRow>
  )
}

function TransactionHashRow({ transactionDetails }: { transactionDetails: TransactionDetails }): JSX.Element | null {
  const { hash, chainId } = transactionDetails
  const { t } = useTranslation()

  if (!hash) {
    return null
  }

  return (
    <InfoRow key="transactionId" label={t('transaction.details.transaction')}>
      <TouchableArea
        alignItems="center"
        flexDirection="row"
        gap="$spacing6"
        justifyContent="center"
        onPress={() => openTransactionLink(hash, chainId)}
      >
        <Text variant="body3">{shortenHash(hash)}</Text>
        <ExternalLink color="$neutral3" size="$icon.16" />
      </TouchableArea>
    </InfoRow>
  )
}

function TransactionOfframpRow({ transactionId }: { transactionId?: string }): JSX.Element | null {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  if (!transactionId) {
    return null
  }

  return (
    <InfoRow key="forTransactionId" label={t('common.transactionId')}>
      <TouchableArea
        alignItems="center"
        flexDirection="row"
        gap="$spacing6"
        justifyContent="center"
        onPress={async (): Promise<void> => {
          await setClipboard(transactionId)
          dispatch(
            pushNotification({
              type: AppNotificationType.Copied,
              copyType: CopyNotificationType.TransactionId,
            }),
          )
        }}
      >
        <Text variant="body3">{shortenAddress({ address: transactionId })}</Text>
        <CopyAlt color="$neutral3" size="$icon.16" />
      </TouchableArea>
    </InfoRow>
  )
}

function DappInfoRow({ label, name, iconUrl }: { label: string; name: string; iconUrl?: string | null }): JSX.Element {
  return (
    <InfoRow label={label}>
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

function SwapRateRow({ typeInfo }: { typeInfo: SwapTypeTransactionInfo | BridgeTransactionInfo }): JSX.Element {
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

function FORProviderRow({
  isDarkMode,
  typeInfo,
}: {
  isDarkMode: boolean
  typeInfo: OnRampPurchaseInfo | OnRampTransferInfo | OffRampSaleInfo
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <InfoRow key="forProvider" label={t('transaction.details.from')}>
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
    </InfoRow>
  )
}

function PoolRow({ typeInfo }: { typeInfo: LiquidityTransactionBaseInfos }): JSX.Element {
  const { t } = useTranslation()

  const currency0 = useCurrencyInfo(typeInfo.currency0Id)
  const currency1 = useCurrencyInfo(typeInfo.currency1Id)

  return (
    <InfoRow label={t('common.pool')}>
      <Text variant="body3">
        {currency0?.currency.symbol ?? '-'} / {currency1?.currency.symbol ?? '-'}
      </Text>
    </InfoRow>
  )
}
